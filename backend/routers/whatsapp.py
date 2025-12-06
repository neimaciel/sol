from fastapi import APIRouter, Request, HTTPException
from services.ai_service import ai_service
from services.whatsapp_service import whatsapp_service
from services.freight_service import freight_service
from services.rag_service import rag_service
from services.conversation_service import conversation_service
from sqlalchemy import text

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

        # 1. Extract Phone Number
        phone = remote_jid.split('@')[0]

        # 2. Find Driver & Candidate
        from core.database import SessionLocal
        from models.driver import Driver
        from models.candidate import Candidate
        from sqlalchemy import desc
        import json
        from datetime import datetime

        async with SessionLocal() as db:
            try:
                # Find driver by phone
                driver = await db.execute(
                    text("SELECT * FROM drivers WHERE phone LIKE :phone"),
                    {"phone": f"%{phone}%"}
                )
                driver = driver.fetchone()

                if driver:
                    # Sync Driver Data (Profile Pic, etc) if available in payload
                    # Note: Evolution API might send 'pushName' or profile pic url in different events
                    # For now, we just log that we found the driver
                    pass

                    # Find latest active candidate for this driver
                    # We assume the chat is related to the most recent active load/candidacy
                    candidate = await db.execute(
                        text("""
                            SELECT * FROM candidates 
                            WHERE driver_id = :driver_id 
                            ORDER BY created_at DESC 
                            LIMIT 1
                        """),
                        {"driver_id": driver.id}
                    )
                    candidate = candidate.fetchone()

                    if candidate:
                        # Append message to chat_messages
                        new_message = {
                            "sender": "driver",
                            "text": user_message,
                            "time": datetime.now().strftime("%H:%M"),
                            "timestamp": datetime.now().isoformat()
                        }
                        
                        # Fetch current messages
                        current_messages = candidate.chat_messages or []
                        if isinstance(current_messages, str):
                            try:
                                current_messages = json.loads(current_messages)
                            except:
                                current_messages = []
                        
                        current_messages.append(new_message)

                        # Update candidate
                        await db.execute(
                            text("UPDATE candidates SET chat_messages = :messages, updated_at = NOW() WHERE id = :id"),
                            {"messages": json.dumps(current_messages), "id": candidate.id}
                        )
                        await db.commit()
                        print(f"Saved message for candidate {candidate.id}")
                
            except Exception as db_e:
                print(f"Database error in webhook: {db_e}")
                await db.rollback()

        # Delegate to ConversationService (AI)
        await conversation_service.handle_message(remote_jid, user_message, message_type)

        return {"status": "processed"}

    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel
import re

class BroadcastRequest(BaseModel):
    whatsapp_id: str
    load_id: str
    origin: str
    destination: str
    value: str
    vehicle_type: str = "TRUCK - RASTREADO"
    body_type: str = "BAÚ"
    weight: str = "A definir"
    material: str = "A definir"
    pickup_date: str = "A combinar"
    delivery_date: str = "A combinar"

@router.post("/broadcast")
async def send_broadcast(request: BroadcastRequest):
    """
    Send broadcast message to WhatsApp group.
    Frontend sends all necessary data directly.
    """
    try:
        # Validate that we have a WhatsApp ID
        if not request.whatsapp_id:
            raise HTTPException(status_code=400, detail="WhatsApp ID is required")

        # Construct Message with new format
        # Construct Message with new format
        # Construct Message with new format
        message = f"*FRETE DEDICADO - {request.load_id}*\n\n" \
                  f"📍 *De:* {request.origin}\n\n" \
                  f"📍 *Para:* {request.destination}\n\n" \
                  f"🚚 *Veículo:* {request.vehicle_type}\n\n" \
                  f"🚛 *Carroceria:* {request.body_type}\n\n" \
                  f"⚖️ *Peso total:* {request.weight}\n\n" \
                  f"📦 *Material:* {request.material}\n\n" \
                  f"💰 *Preço:* {request.value}\n\n" \
                  f"📆 *Coleta:* {request.pickup_date}\n\n" \
                  f"📆 *Entrega:* {request.delivery_date}\n\n" \
                  f"👉 *QUERO ESSA CARGA:* https://sol-logistics-ai.vercel.app/motorista/carga/{request.load_id}\n\n" \
                  f"_Clique no link acima para se candidatar!_"

        # Send Message
        response = await whatsapp_service.send_message(request.whatsapp_id, message)
        
        if not response:
             raise HTTPException(status_code=500, detail="Failed to send message via WhatsApp Service")

        return {"status": "sent", "whatsapp_id": request.whatsapp_id, "message": message}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending broadcast: {e}")
        raise HTTPException(status_code=500, detail=f"Error sending broadcast: {str(e)}")

class SendMessageRequest(BaseModel):
    candidate_id: str
    message: str

@router.post("/send-message")
async def send_message(request: SendMessageRequest):
    """
    Send a direct message to a candidate/driver and store it.
    """
    try:
        from core.database import SessionLocal
        from models.candidate import Candidate
        from models.driver import Driver
        import json
        from datetime import datetime

        async with SessionLocal() as db:
            # 1. Get Candidate & Driver
            candidate_result = await db.execute(
                text("""
                    SELECT c.*, d.phone 
                    FROM candidates c
                    JOIN drivers d ON c.driver_id = d.id
                    WHERE c.id = :id
                """),
                {"id": request.candidate_id}
            )
            candidate_data = candidate_result.fetchone()
            
            if not candidate_data:
                raise HTTPException(status_code=404, detail="Candidate not found")

            phone = candidate_data.phone
            if not phone:
                 raise HTTPException(status_code=400, detail="Driver has no phone number")

            # 2. Send via WhatsApp Service
            # Format phone for WhatsApp (remove non-digits, add country code if missing)
            # Assuming phone is stored cleanly or needs minimal cleaning
            clean_phone = re.sub(r'\D', '', phone)
            whatsapp_id = f"{clean_phone}@s.whatsapp.net"

            response = await whatsapp_service.send_message(whatsapp_id, request.message)
            
            if not response:
                 raise HTTPException(status_code=500, detail="Failed to send message via WhatsApp")

            # 3. Store in DB
            new_message = {
                "sender": "user",
                "text": request.message,
                "time": datetime.now().strftime("%H:%M"),
                "timestamp": datetime.now().isoformat()
            }
            
            current_messages = candidate_data.chat_messages or []
            if isinstance(current_messages, str):
                try:
                    current_messages = json.loads(current_messages)
                except:
                    current_messages = []
            
            current_messages.append(new_message)

            await db.execute(
                text("UPDATE candidates SET chat_messages = :messages, updated_at = NOW() WHERE id = :id"),
                {"messages": json.dumps(current_messages), "id": request.candidate_id}
            )
            await db.commit()

            return {"status": "sent", "message": new_message}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ExtractJIDRequest(BaseModel):
    invite_link: str

@router.post("/extract-group-jid")
async def extract_group_jid(request: ExtractJIDRequest):
    """
    Extract WhatsApp Group JID from invite link.
    
    Example:
    - Input: "https://chat.whatsapp.com/ABC123XYZ"
    - Output: {"jid": "120363XXXXX@g.us", "invite_code": "ABC123XYZ"}
    """
    try:
        # Extract invite code from link
        # Supports formats:
        # - https://chat.whatsapp.com/ABC123
        # - chat.whatsapp.com/ABC123
        # - ABC123 (just the code)
        
        invite_code = request.invite_link.strip()
        
        # Remove protocol and domain if present
        if "chat.whatsapp.com/" in invite_code:
            invite_code = invite_code.split("chat.whatsapp.com/")[-1]
        
        # Remove any query parameters or fragments
        invite_code = re.split(r'[?#]', invite_code)[0]
        
        if not invite_code:
            raise HTTPException(status_code=400, detail="Invalid invite link format")
        
        # Call WhatsApp service to get group JID
        jid = await whatsapp_service.get_group_jid_from_invite(invite_code)
        
        if not jid:
            raise HTTPException(
                status_code=404, 
                detail="Could not extract Group JID. Make sure the invite link is valid and the bot has access."
            )
        
        return {
            "jid": jid,
            "invite_code": invite_code,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error extracting group JID: {e}")
        # Return the actual error message from the service
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_instance_status():
    """
    Get the connection status of the WhatsApp instance.
    """
    result = await whatsapp_service.get_instance_status()
    if not result:
        raise HTTPException(status_code=500, detail="Failed to get instance status")
    return result

@router.get("/connect")
async def connect_instance():
    """
    Connect the instance and get QR Code.
    """
    result = await whatsapp_service.connect_instance()
    if not result:
        raise HTTPException(status_code=500, detail="Unknown error connecting instance")
        
    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])
        
    return result

@router.post("/logout")
async def logout_instance():
    """
    Logout the instance.
    """
    result = await whatsapp_service.logout_instance()
    if not result:
        raise HTTPException(status_code=500, detail="Failed to logout instance")
    return result

@router.get("/system-phone")
async def get_system_phone():
    """
    Get the connected system phone number.
    Returns the number from the connected WhatsApp instance.
    """
    try:
        # Check status first
        status = await whatsapp_service.get_instance_status()
        
        state = status.get('state')
        if not state and 'instance' in status:
            state = status['instance'].get('state')
            
        if state != 'open':
             return {"phone": None, "status": "disconnected"}

        # Get instance info to find the number
        info = await whatsapp_service.get_instance_info()
        if not info:
             return {"phone": None, "status": "connected_but_no_info"}

        # Extract number from owner JID
        # Structure might vary: info['instance']['owner'], info['owner'], or info['ownerJid']
        owner_jid = info.get('instance', {}).get('owner') or \
                   info.get('owner') or \
                   info.get('ownerJid')
        
        if owner_jid:
            # Format: 554199999999@s.whatsapp.net
            phone = owner_jid.split('@')[0]
            return {"phone": phone, "status": "connected"}
            
        return {"phone": None, "status": "connected_no_owner"}
        
    except Exception as e:
        print(f"Error getting system phone: {e}")
        return {"phone": None, "error": str(e)}
