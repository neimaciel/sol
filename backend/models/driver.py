from sqlalchemy import Column, String, DateTime, func
from core.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(String, primary_key=True)  # WhatsApp ID (remoteJid)
    name = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
