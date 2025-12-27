from sqlalchemy import Column, String, Float, DateTime, func, Text, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Load(Base):
    __tablename__ = "loads"

    id = Column(String, primary_key=True)
    title = Column(String)
    origin = Column(String)
    destination = Column(String)
    value = Column(String)
    status = Column(String)
    column_id = Column(String, default='registration')
    
    # Coordinates
    origin_lat = Column(Float, nullable=True)
    origin_lon = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lon = Column(Float, nullable=True)

    # Phase 5 Fields
    whatsapp_group_id = Column(String, nullable=True)
    broadcast_status = Column(String, nullable=True)
    sent_groups = Column(Text, default="[]")  # JSON as text for SQLite
    
    driver_id = Column(String, ForeignKey("drivers.id"), nullable=True) # Foreign key to drivers table
    
    # Payment Status
    payment_status = Column(String, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    
    # Relationships
    payment = relationship("Payment", back_populates="load", uselist=False)
    driver = relationship("Driver", backref="loads")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
