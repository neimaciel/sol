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
        message = f"FRETE DEDICADO - {request.load_id}\\n\\n" \
                  f"📍 De: {request.origin}\\n\\n" \
                  f"📍 Para: {request.destination}\\n\\n" \
                  f"🚚 Veículo: {request.vehicle_type}\\n\\n" \
                  f"🚛 Carroceria: {request.body_type}\\n\\n" \
                  f"⚖️ Peso total: {request.weight}\\n\\n" \
                  f"📦 Material: {request.material}\\n\\n" \
                  f"💰 Preço: {request.value}\\n\\n" \
                  f"📆 Coleta: {request.pickup_date}\\n\\n" \
                  f"📆 Entrega: {request.delivery_date}\\n\\n" \
                  f"👉 QUERO ESSA CARGA: https://sol-logistics-ai.vercel.app/motorista/carga/{request.load_id}\\n\\n" \
                  f"Clique no link acima para se candidatar!"

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
