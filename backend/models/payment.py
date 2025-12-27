from sqlalchemy import Column, String, Float, DateTime, func, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True)
    load_id = Column(String, ForeignKey("loads.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(String, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    
    # Valores
    amount = Column(Float, nullable=False)  # Valor do frete
    currency = Column(String, default="BRL")  # Moeda
    
    # Status e Método
    status = Column(String, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED, MANUAL_CONFIRMED
    payment_method = Column(String, default="MANUAL")  # MANUAL, PIX, CARD, BANK_TRANSFER
    
    # Dados Bancários (para pagamento manual)
    bank_name = Column(String, nullable=True)
    bank_agency = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    bank_account_type = Column(String, nullable=True)  # CHECKING, SAVINGS
    pix_key = Column(String, nullable=True)
    pix_key_type = Column(String, nullable=True)  # CPF, CNPJ, EMAIL, PHONE, RANDOM
    
    # Gateway de Pagamento
    gateway_provider = Column(String, nullable=True)  # STRIPE, MERCADO_PAGO, ASAAS
    gateway_payment_id = Column(String, nullable=True)  # ID do pagamento no gateway
    gateway_response = Column(Text, nullable=True)  # Resposta completa do gateway (JSON)
    
    # Confirmação Manual
    manual_confirmed_by = Column(String, nullable=True)  # ID do operador que confirmou
    manual_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    manual_confirmation_notes = Column(Text, nullable=True)
    
    # Comprovantes
    receipt_url = Column(String, nullable=True)  # URL do comprovante
    receipt_uploaded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relacionamentos
    load = relationship("Load", back_populates="payment")
    driver = relationship("Driver", back_populates="payments")


class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)  # PIX, Cartão de Crédito, etc.
    type = Column(String, nullable=False)  # MANUAL, GATEWAY
    gateway_provider = Column(String, nullable=True)  # STRIPE, MERCADO_PAGO
    is_active = Column(Boolean, default=True)
    requires_bank_data = Column(Boolean, default=False)
    supports_instant = Column(Boolean, default=False)
    processing_time = Column(String, nullable=True)  # "Instantâneo", "1-3 dias úteis"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())