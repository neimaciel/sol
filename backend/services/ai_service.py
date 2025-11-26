import google.generativeai as genai
from core.config import get_settings

settings = get_settings()

class AIService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-1.5-flash') # Using 1.5 Flash as proxy for 2.5 Flash if not available yet
        else:
            print("Warning: GEMINI_API_KEY not set.")
            self.model = None

    async def generate_response(self, prompt: str, system_instruction: str = None) -> str:
        if not self.model:
            return "Erro: API Key do Gemini não configurada."

        try:
            # Construct the full prompt with system instruction
            full_prompt = prompt
            if system_instruction:
                full_prompt = f"System Instruction: {system_instruction}\n\nUser: {prompt}"

            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return "Desculpe, estou com dificuldades para processar sua solicitação no momento."

    async def analyze_intent(self, message: str) -> str:
        """
        Analyzes the user message to determine intent:
        - GREETING
        - FREIGHT_SEARCH
        - REGISTER_VEHICLE
        - DOUBT
        """
        prompt = f"""
        Analise a mensagem do motorista e classifique a intenção em uma das seguintes categorias:
        - GREETING (Oi, Olá, Bom dia, etc.)
        - FREIGHT_SEARCH (Quero carga, tem carga pra hoje, busca de frete)
        - REGISTER_VEHICLE (Quero cadastrar, cadastrar caminhão)
        - DOUBT (Dúvida sobre pagamento, como funciona, etc.)
        
        Mensagem: "{message}"
        
        Responda APENAS com a categoria.
        """
        return await self.generate_response(prompt)

ai_service = AIService()
