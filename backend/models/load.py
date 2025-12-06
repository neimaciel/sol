from sqlalchemy import Column, String, Float, DateTime, func, JSON
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
    sent_groups = Column(JSON, default=[])
    
    driver_id = Column(String, nullable=True) # Foreign key to drivers table (implicit or explicit)
    
    # Relationships (if needed for joins)
    # driver = relationship("Driver", backref="loads")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
