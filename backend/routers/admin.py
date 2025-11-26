from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import json
import os

router = APIRouter()

CONFIG_FILE = "agent_config.json"

class AgentConfig(BaseModel):
    model: str
    system_prompt: str
    temperature: float = 0.7

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {
        "model": "gemini-1.5-flash",
        "system_prompt": "Você é um assistente logístico experiente. Seja direto e útil.",
        "temperature": 0.7
    }

def save_config(config: dict):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

@router.get("/config")
async def get_config():
    return load_config()

@router.post("/config")
async def update_config(config: AgentConfig):
    save_config(config.model_dump())
    return {"status": "updated", "config": config}

@router.post("/rag/upload")
async def upload_rag_document(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Extract text
    text = ""
    if file.filename.endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    else:
        # Assume text file
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
            
    # Index document
    from services.rag_service import rag_service
    await rag_service.add_document(text, metadata={"source": file.filename})
    
    return {"status": "uploaded_and_indexed", "filename": file.filename}
