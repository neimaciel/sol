from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.orm import relationship
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
    
    # Dados Bancários (para pagamento manual)
    bank_name = Column(String, nullable=True)
    bank_agency = Column(String, nullable=True) 
    bank_account = Column(String, nullable=True)
    bank_account_type = Column(String, nullable=True)  # CHECKING, SAVINGS
    pix_key = Column(String, nullable=True)
    pix_key_type = Column(String, nullable=True)  # CPF, CNPJ, EMAIL, PHONE, RANDOM
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    payments = relationship("Payment", back_populates="driver")
