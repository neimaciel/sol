from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from core.database import get_db
from models.driver import Driver
from models.load import Load
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class LoadSchema(BaseModel):
    id: str
    title: str
    origin: str
    destination: str
    value: str
    status: str
    date: str
    column_id: str

class DriverProfile(BaseModel):
    driver: dict
    active_load: Optional[LoadSchema]
    history: List[LoadSchema]

@router.get("/{driver_id}/profile", response_model=DriverProfile)
async def get_driver_profile(driver_id: str, db: Session = Depends(get_db)):
    # 1. Get Driver Info
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Convert driver to dict
    driver_data = {
        "id": driver.id,
        "name": driver.name,
        "phone": driver.phone,
        "vehicle": driver.vehicle_type, # Map vehicle_type to vehicle
        "location": "Desconhecido", # Not in DB model currently, placeholder
        "rating": 5.0, # Placeholder or need to add to model
        "photo": "https://i.pravatar.cc/150", # Placeholder
        "status": "available" # Placeholder logic
    }
    
    # 2. Get Active Load (not completed)
    active_load = db.query(Load).filter(
        Load.driver_id == driver_id,
        Load.column_id != "completed"
    ).first()
    
    active_load_data = None
    if active_load:
        active_load_data = LoadSchema(
            id=active_load.id,
            title=active_load.title,
            origin=active_load.origin,
            destination=active_load.destination,
            value=active_load.value,
            status=active_load.status or "Em andamento",
            date=str(active_load.created_at), # Simplification
            column_id=active_load.column_id
        )
        driver_data["status"] = "busy"
    
    # 3. Get History (completed loads)
    history_loads = db.query(Load).filter(
        Load.driver_id == driver_id,
        Load.column_id == "completed"
    ).order_by(desc(Load.created_at)).all()
    
    history_data = [
        LoadSchema(
            id=load.id,
            title=load.title,
            origin=load.origin,
            destination=load.destination,
            value=load.value,
            status="Concluído",
            date=str(load.created_at),
            column_id=load.column_id
        ) for load in history_loads
    ]
    
    return DriverProfile(
        driver=driver_data,
        active_load=active_load_data,
        history=history_data
    )
