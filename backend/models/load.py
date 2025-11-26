from sqlalchemy import Column, String, Float, DateTime, func
from core.database import Base

class Load(Base):
    __tablename__ = "loads"

    id = Column(String, primary_key=True)
    title = Column(String)
    origin = Column(String)
    destination = Column(String)
    value = Column(String)
    status = Column(String)
    
    # Coordinates
    origin_lat = Column(Float, nullable=True)
    origin_lon = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lon = Column(Float, nullable=True)

    # Phase 5 Fields
    whatsapp_group_id = Column(String, nullable=True)
    broadcast_status = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
