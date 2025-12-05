import httpx
from typing import Optional
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
            "text": text
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Error sending WhatsApp message: {e}")
                return None

    async def get_group_jid_from_invite(self, invite_code: str) -> Optional[str]:
        """
        Extract Group JID from WhatsApp invite link.
        
        Args:
            invite_code: The invite code from the link (e.g., "XXX" from https://chat.whatsapp.com/XXX)
        
        Returns:
            Group JID (e.g., "120363XXXXX@g.us") or None if failed
        """
        if not self.base_url or not self.api_key:
            print("Warning: Evolution API URL or Key not set.")
            return None

        # Evolution API endpoint to get group info by invite code
        # Evolution API endpoint to get group info by invite code
        # Usually GET /group/inviteInfo/{instance}?inviteCode=...
        url = f"{self.base_url}/group/inviteInfo/{settings.INSTANCE_NAME}"
        
        params = {
            "inviteCode": invite_code
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                # Evolution API returns group info with 'id' field containing the JID
                if isinstance(data, dict) and "id" in data:
                    group_jid = data["id"]
                    print(f"✅ Extracted Group JID: {group_jid}")
                    return group_jid
                else:
                    print(f"❌ Unexpected response format: {data}")
                    return None
                    
            except httpx.HTTPStatusError as e:
                error_msg = f"Evolution API Error: {e.response.status_code} - {e.response.text}"
                print(f"❌ {error_msg}")
                raise Exception(error_msg)
            except Exception as e:
                print(f"❌ Error getting group info from invite: {e}")
                raise Exception(f"Internal Error: {str(e)}")

    async def get_instance_status(self):
        """
        Get the connection status of the instance.
        """
        if not self.base_url or not self.api_key:
            return {"status": "error", "reason": "Evolution API not configured"}

        url = f"{self.base_url}/instance/connectionState/{settings.INSTANCE_NAME}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, timeout=5.0)
                if response.status_code == 404:
                     # Instance might not exist, try to fetch instance info to check
                     return {"instance": settings.INSTANCE_NAME, "state": "not_found"}
                
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Error getting instance status: {e}")
                return {"status": "error", "reason": str(e)}

    async def connect_instance(self):
        """
        Connect the instance and get QR Code.
        """
        if not self.base_url or not self.api_key:
            return None

        url = f"{self.base_url}/instance/connect/{settings.INSTANCE_NAME}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Error connecting instance: {e}")
                return None

    async def logout_instance(self):
        """
        Logout the instance.
        """
        if not self.base_url or not self.api_key:
            return None

        url = f"{self.base_url}/instance/logout/{settings.INSTANCE_NAME}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.delete(url, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Error logging out instance: {e}")
                return None

    async def get_instance_info(self):
        """
        Get full instance info including phone number.
        """
        if not self.base_url or not self.api_key:
            return None

        # Evolution API endpoint to fetch specific instance info
        # Usually /instance/fetchInstances?instanceName=...
        url = f"{self.base_url}/instance/fetchInstances"
        params = {"instanceName": settings.INSTANCE_NAME}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, headers=self.headers, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                # Data is usually a list or a single object depending on version
                # We expect a list containing our instance
                if isinstance(data, list):
                    for instance in data:
                        # Check various possible fields for instance name
                        inst_name = instance.get('instance', {}).get('instanceName') or \
                                   instance.get('instanceName') or \
                                   instance.get('name')
                        
                        if inst_name == settings.INSTANCE_NAME or inst_name == "SOL": # specific fix for this case
                            return instance
                            
                    # If we filtered by instanceName and got a single result, return it
                    if len(data) == 1:
                        return data[0]
                        
                elif isinstance(data, dict):
                     inst_name = data.get('instance', {}).get('instanceName') or \
                                data.get('instanceName') or \
                                data.get('name')
                     if inst_name == settings.INSTANCE_NAME or inst_name == "SOL":
                        return data
                
                return None
            except Exception as e:
                print(f"Error getting instance info: {e}")
                return None

whatsapp_service = WhatsAppService()
