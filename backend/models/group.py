from sqlalchemy import Column, String, DateTime, func
from core.database import Base

class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True)
    name = Column(String)
    whatsapp_link = Column(String)
    whatsapp_id = Column(String, nullable=True) # The JID of the group (e.g. 12345@g.us)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
