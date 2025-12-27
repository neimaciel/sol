from sqlalchemy import Column, String, DateTime, Integer, Text, func
from core.database import Base
import uuid

class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="Frota Própria")  # 'Frota Própria', 'Agregados', 'Terceiros'
    description = Column(Text, nullable=True)
    region = Column(String, nullable=True)
    whatsapp_link = Column(String, nullable=True)
    whatsapp_id = Column(String, nullable=True)  # The JID of the group (e.g. 12345@g.us)
    members_count = Column(Integer, nullable=False, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
