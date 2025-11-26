import httpx
from core.config import get_settings

settings = get_settings()

class WhatsAppService:
    def __init__(self):
        self.base_url = settings.EVOLUTION_API_URL
        self.api_key = settings.EVOLUTION_API_KEY
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }

    async def send_message(self, number: str, text: str):
        if not self.base_url or not self.api_key:
            print("Warning: Evolution API URL or Key not set.")
            return

        # Evolution API endpoint: /message/sendText/{instance}
        url = f"{self.base_url}/message/sendText/{settings.INSTANCE_NAME}"
        
        payload = {
            "number": number,
            "options": {
                "delay": 1200,
                "presence": "composing",
                "linkPreview": False
            },
            "textMessage": {
                "text": text
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Error sending WhatsApp message: {e}")
                return None

whatsapp_service = WhatsAppService()
