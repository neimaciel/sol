from fastapi import APIRouter, Request, HTTPException
from services.ai_service import ai_service
from services.whatsapp_service import whatsapp_service
from services.freight_service import freight_service
from services.rag_service import rag_service
from services.conversation_service import conversation_service
from sqlalchemy import text, select
from sqlalchemy.orm import selectinload
from fastapi import Depends
from core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

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

        print(f"📩 Received message from {remote_jid}: {user_message}")

        # 1. Extract Phone Number
        # remote_jid is like 554199999999@s.whatsapp.net
        phone = remote_jid.split('@')[0]

        # 2. Find Driver & Candidate using ORM
        from core.database import SessionLocal
        from models.driver import Driver
        from models.candidate import Candidate
        from sqlalchemy import desc
        import json
        from datetime import datetime

        async with SessionLocal() as db:
            try:
                # Find driver by ID (clean phone)
                # We try exact match on ID first (preferred), then fuzzy on phone column if needed
                result = await db.execute(select(Driver).where(Driver.id == phone))
                driver = result.scalars().first()

                if not driver:
                    print(f"⚠️ Driver not found for phone {phone}")
                    # Optional: Try to find by phone column if ID doesn't match?
                    # result = await db.execute(select(Driver).where(Driver.phone.like(f"%{phone}%")))
                    # driver = result.scalars().first()
                
                if driver:
                    print(f"👤 Driver identified: {driver.name} ({driver.id})")
                    
                    # Sync Driver Data (Profile Pic)
                    try:
                        profile_pic = await whatsapp_service.get_profile_picture(phone)
                        if profile_pic and profile_pic != driver.photo:
                            driver.photo = profile_pic
                            driver.updated_at = datetime.now()
                            await db.commit() # Commit profile pic update immediately
                            print(f"📸 Updated profile picture for driver {driver.name}")
                    except Exception as e:
                        print(f"⚠️ Failed to sync profile picture: {e}")

                    # Find latest active candidate for this driver
                    # We want the most recent one
                    candidate_result = await db.execute(
                        select(Candidate)
                        .where(Candidate.driver_id == driver.id)
                        .order_by(desc(Candidate.created_at))
                        .limit(1)
                    )
                    candidate = candidate_result.scalars().first()

                    if candidate:
                        print(f"📝 Found candidate record {candidate.id} for load {candidate.load_id}")
                        
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
                        
                        # Ensure it's a list
                        if not isinstance(current_messages, list):
                            current_messages = []

                        current_messages.append(new_message)

                        # Update candidate
                        # We need to re-assign to trigger SQLAlchemy change detection for JSON types usually,
                        # but explicit assignment is best.
                        candidate.chat_messages = list(current_messages) 
                        candidate.updated_at = datetime.now()
                        
                        await db.commit()
                        print(f"✅ Saved message for candidate {candidate.id}")
                    else:
                        print(f"⚠️ No candidate record found for driver {driver.id}")
                
            except Exception as db_e:
                print(f"❌ Database error in webhook: {db_e}")
                import traceback
                traceback.print_exc()
                await db.rollback()

        # Delegate to ConversationService (AI)
        # We run this even if driver not found? Maybe.
        await conversation_service.handle_message(remote_jid, user_message, message_type)

        return {"status": "processed"}

    except Exception as e:
        print(f"❌ Error processing webhook: {e}")
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
async def send_message(request: SendMessageRequest, db: AsyncSession = Depends(get_db)):
    """
    Send a direct message to a candidate/driver and store it.
    """
    try:
        from models.candidate import Candidate
        from models.driver import Driver
        import json
        from datetime import datetime
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        # 1. Get Candidate & Driver
        result = await db.execute(
            select(Candidate)
            .options(selectinload(Candidate.driver))
            .where(Candidate.id == request.candidate_id)
        )
        candidate = result.scalars().first()
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        if not candidate.driver or not candidate.driver.phone:
             raise HTTPException(status_code=400, detail="Driver has no phone number")

        phone = candidate.driver.phone

        # 2. Send via WhatsApp Service
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
        
        current_messages = candidate.chat_messages or []
        if isinstance(current_messages, str):
            try:
                current_messages = json.loads(current_messages)
            except:
                current_messages = []
        
        # Create a new list to ensure SQLAlchemy detects the change
        updated_messages = list(current_messages)
        updated_messages.append(new_message)
        
        candidate.chat_messages = updated_messages
        candidate.updated_at = datetime.now()
        
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
