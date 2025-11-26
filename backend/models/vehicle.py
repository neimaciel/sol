from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func
from core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_id = Column(String, ForeignKey("drivers.id"))
    type = Column(String)  # Truck, Van, Car, etc.
    plate = Column(String, nullable=True)
    capacity = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
