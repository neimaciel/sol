from fastapi import APIRouter, Request, HTTPException
from services.ai_service import ai_service
from services.whatsapp_service import whatsapp_service
from services.freight_service import freight_service
from services.rag_service import rag_service
from services.conversation_service import conversation_service

router = APIRouter()

@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    try:
        body = await request.json()
        # Evolution API structure validation
        data = body.get("data")
        if not data:
            return {"status": "ignored", "reason": "no data"}
        
        message_type = data.get("messageType")
        if message_type != "conversation" and message_type != "extendedTextMessage":
             # Note: extendedTextMessage is often used for replies or forwarded messages, 
             # but for MVP we focus on conversation (text). 
             # We might want to handle location messages later.
             pass

        remote_jid = data.get("key", {}).get("remoteJid")
        if not remote_jid:
            return {"status": "ignored", "reason": "no remoteJid"}

        # Extract message content based on type
        user_message = ""
        if message_type == "conversation":
            user_message = data.get("message", {}).get("conversation")
        elif message_type == "extendedTextMessage":
            user_message = data.get("message", {}).get("extendedTextMessage", {}).get("text")
        
        if not user_message:
             return {"status": "ignored", "reason": "no message content"}

        print(f"Received message from {remote_jid}: {user_message}")

        # Delegate to ConversationService
        await conversation_service.handle_message(remote_jid, user_message, message_type)

        return {"status": "processed"}

    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel
from sqlalchemy import select
from core.database import get_db
from models.load import Load
from models.group import Group

class BroadcastRequest(BaseModel):
    load_id: str
    group_id: str

@router.post("/broadcast")
async def send_broadcast(request: BroadcastRequest):
    async with get_db() as session:
        # Fetch Load
        result = await session.execute(select(Load).where(Load.id == request.load_id))
        load = result.scalars().first()
        if not load:
            raise HTTPException(status_code=404, detail="Load not found")

        # Fetch Group
        result = await session.execute(select(Group).where(Group.id == request.group_id))
        group = result.scalars().first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Check if group has a JID
        if not group.whatsapp_id:
            # Fallback: Try to use whatsapp_link if it looks like a JID (unlikely but possible)
            # Or just log a warning and return
            print(f"Group {group.name} has no whatsapp_id")
            raise HTTPException(status_code=400, detail="Selected group does not have a WhatsApp ID configured.")

        # Construct Message
        message = f"*NOVA CARGA DISPONÍVEL* 🚚\n\n" \
                  f"*Origem:* {load.origin}\n" \
                  f"*Destino:* {load.destination}\n" \
                  f"*Valor:* {load.value}\n" \
                  f"*Veículo:* {load.vehicle_type if hasattr(load, 'vehicle_type') else 'Carreta'}\n\n" \
                  f"Interessados, favor responder aqui!"

        # Send Message
        response = await whatsapp_service.send_message(group.whatsapp_id, message)
        
        if not response:
             raise HTTPException(status_code=500, detail="Failed to send message via WhatsApp Service")

        return {"status": "sent", "group": group.name, "message": message}
