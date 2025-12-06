from sqlalchemy import Column, String, DateTime, func
from core.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(String, primary_key=True)  # WhatsApp ID (remoteJid)
    name = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True)
    vehicle_type = Column(String, nullable=True)
    vehicle_plate = Column(String, nullable=True)
    cpf_cnpj = Column(String, nullable=True)
    photo = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
