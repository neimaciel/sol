from sqlalchemy import Column, String, DateTime, func, ForeignKey, JSON, Text
from core.database import Base
import uuid

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    load_id = Column(String, ForeignKey("loads.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(String, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending")  # pending, negotiating, selected, rejected
    chat_messages = Column(Text, default="[]")  # JSON as text for SQLite compatibility
    
    from sqlalchemy.orm import relationship
    
    driver = relationship("Driver", backref="candidates")
    load = relationship("Load", backref="candidates")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
