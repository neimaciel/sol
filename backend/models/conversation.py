from sqlalchemy import Column, String, JSON, DateTime, func
from core.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True)  # WhatsApp ID (remoteJid)
    state = Column(String, default="IDLE")
    data = Column(JSON, default={})
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
