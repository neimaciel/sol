from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.conversation import Conversation
from models.driver import Driver
from models.vehicle import Vehicle
from services.ai_service import ai_service
from services.whatsapp_service import whatsapp_service
from services.freight_service import freight_service
from services.rag_service import rag_service
import json

class ConversationService:
    async def get_or_create_session(self, db: AsyncSession, remote_jid: str) -> Conversation:
        result = await db.execute(select(Conversation).where(Conversation.id == remote_jid))
        session = result.scalar_one_or_none()
        
        if not session:
            session = Conversation(id=remote_jid, state="IDLE", data={})
            db.add(session)
            await db.commit()
            await db.refresh(session)
        
        return session

    async def update_state(self, db: AsyncSession, session: Conversation, new_state: str, data_update: dict = None):
        session.state = new_state
        if data_update:
            # Ensure data is a dict
            current_data = session.data if isinstance(session.data, dict) else {}
            current_data.update(data_update)
            session.data = current_data
            # Force update for SQLAlchemy to detect JSON change
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(session, "data")
        
        await db.commit()
        await db.refresh(session)

    async def handle_message(self, remote_jid: str, message_text: str, message_type: str = "text"):
        # Properly get the session from the generator
        db_gen = get_db()
        db = await db_gen.__anext__()
        
        try:
            session = await self.get_or_create_session(db, remote_jid)
            
            print(f"[{remote_jid}] State: {session.state} | Message: {message_text}")

            if session.state == "IDLE":
                await self._handle_idle_state(db, session, remote_jid, message_text)
            elif session.state == "REGISTRATION_NAME":
                await self._handle_registration_name(db, session, remote_jid, message_text)
            elif session.state == "REGISTRATION_VEHICLE":
                await self._handle_registration_vehicle(db, session, remote_jid, message_text)
            elif session.state == "SEARCH_LOCATION":
                await self._handle_search_location(db, session, remote_jid, message_text, message_type)
            else:
                # Fallback to IDLE if state is unknown
                await self.update_state(db, session, "IDLE")
                await whatsapp_service.send_message(remote_jid, "Ocorreu um erro no fluxo. Vamos recomeçar. Como posso ajudar?")
        finally:
            await db.close()

    async def _handle_idle_state(self, db: AsyncSession, session: Conversation, remote_jid: str, text: str):
        intent = await ai_service.analyze_intent(text)
        print(f"[{remote_jid}] Intent: {intent}")

        if "REGISTER_VEHICLE" in intent:
            await self.update_state(db, session, "REGISTRATION_NAME")
            await whatsapp_service.send_message(remote_jid, "Ótimo! Vamos fazer seu cadastro. Primeiro, qual é o seu nome completo?")
        
        elif "FREIGHT_SEARCH" in intent:
            await self.update_state(db, session, "SEARCH_LOCATION")
            await whatsapp_service.send_message(remote_jid, "Para encontrar cargas próximas, por favor, compartilhe sua localização atual (clique no clipe 📎 > Localização).")
        
        elif "DOUBT" in intent:
            context = await rag_service.search_context(text)
            response = await ai_service.generate_response(text, system_instruction=f"Responda com base neste contexto: {context}")
            await whatsapp_service.send_message(remote_jid, response)
        
        elif "GREETING" in intent:
             await whatsapp_service.send_message(remote_jid, "Olá! Sou o assistente da SOL Logística. Posso ajudar com:\n1. Buscar Cargas 🚚\n2. Cadastrar Veículo 📝\n3. Tirar Dúvidas ❓\n\nComo posso ajudar?")
        
        else:
            response = await ai_service.generate_response(text)
            await whatsapp_service.send_message(remote_jid, response)

    async def _handle_registration_name(self, db: AsyncSession, session: Conversation, remote_jid: str, text: str):
        await self.update_state(db, session, "REGISTRATION_VEHICLE", {"name": text})
        await whatsapp_service.send_message(remote_jid, f"Prazer, {text}! Agora, qual é o tipo do seu veículo? (Ex: Truck, Carreta, Van)")

    async def _handle_registration_vehicle(self, db: AsyncSession, session: Conversation, remote_jid: str, text: str):
        # Save Driver and Vehicle
        driver_data = session.data
        name = driver_data.get("name")
        
        # Check if driver exists
        result = await db.execute(select(Driver).where(Driver.id == remote_jid))
        driver = result.scalar_one_or_none()
        
        if not driver:
            driver = Driver(id=remote_jid, name=name, phone=remote_jid)
            db.add(driver)
            await db.flush() # Get ID if needed, though it's remote_jid
        else:
            driver.name = name
        
        vehicle = Vehicle(driver_id=driver.id, type=text)
        db.add(vehicle)
        
        await self.update_state(db, session, "IDLE", {}) # Clear temp data
        await whatsapp_service.send_message(remote_jid, "Cadastro realizado com sucesso! 🚀\nAgora você pode buscar cargas.")

    async def _handle_search_location(self, db: AsyncSession, session: Conversation, remote_jid: str, text: str, message_type: str):
        # In a real scenario, we'd parse the location message type from Evolution API
        # For now, we'll accept text input like "Sao Paulo" or handle lat/lon if passed
        
        # Mocking location extraction or using text search
        # If message_type is location, we would extract lat/lon.
        # For simplicity in this text-based MVP:
        
        lat, lon = -23.5505, -46.6333 # Default SP
        
        # If the user sent a text location, we could use geocoding (not implemented yet), so we'll use mock logic or assume they sent coordinates in text for testing?
        # Let's assume for this MVP they might send text and we just search broadly or use the mock coordinates.
        
        loads = await freight_service.search_loads(lat, lon, radius_km=500) # Wide radius for testing
        
        if not loads:
            await whatsapp_service.send_message(remote_jid, "Não encontrei cargas próximas no momento.")
        else:
            msg = "🔍 *Cargas Encontradas:*\n\n"
            for load in loads[:3]:
                msg += f"📦 *{load['title']}*\n📍 {load['origin']} -> {load['destination']}\n💰 {load['value']}\n\n"
            
            await whatsapp_service.send_message(remote_jid, msg)
        
        await self.update_state(db, session, "IDLE")

conversation_service = ConversationService()
