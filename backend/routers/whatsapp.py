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
