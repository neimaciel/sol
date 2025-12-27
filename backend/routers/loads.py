from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, select
from sqlalchemy.orm import joinedload
from core.database import get_db
from models.load import Load
from models.driver import Driver
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class LoadCreate(BaseModel):
    title: str
    origin: str
    destination: str
    value: str
    priority: str = "normal"
    column_id: str = "registration"
    date: Optional[str] = None

class LoadUpdate(BaseModel):
    title: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    value: Optional[str] = None
    column_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    driver_id: Optional[str] = None
    broadcast_status: Optional[str] = None
    payment_status: Optional[str] = None

@router.get("/")
async def list_loads(db: AsyncSession = Depends(get_db)):
    """List all loads with drivers"""
    try:
        # Query loads with optional driver relationship
        result = await db.execute(
            select(Load)
            .options(joinedload(Load.driver))
            .order_by(desc(Load.created_at))
        )
        loads = result.scalars().all()
        
        loads_data = []
        for load in loads:
            load_data = {
                "id": load.id,
                "title": load.title,
                "origin": load.origin,
                "destination": load.destination,
                "value": load.value,
                "status": load.status,
                "column_id": load.column_id,
                "origin_lat": load.origin_lat,
                "origin_lon": load.origin_lon,
                "destination_lat": load.destination_lat,
                "destination_lon": load.destination_lon,
                "broadcast_status": load.broadcast_status,
                "sent_groups": load.sent_groups,
                "driver_id": load.driver_id,
                "payment_status": load.payment_status,
                "created_at": load.created_at.isoformat() if load.created_at else None,
                "driver": None
            }
            
            # Add driver info if available
            if load.driver:
                load_data["driver"] = {
                    "id": load.driver.id,
                    "name": load.driver.name,
                    "phone": load.driver.phone,
                    "vehicle_type": load.driver.vehicle_type,
                    "vehicle_plate": load.driver.vehicle_plate,
                    "photo": load.driver.photo,
                    "rating": 5.0,  # Default rating
                    "location": "Disponível",
                    "vehicle": load.driver.vehicle_type or "Não informado",
                    "status": "busy" if load.driver_id else "available"
                }
            
            loads_data.append(load_data)
        
        return {"loads": loads_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_load(load: LoadCreate, db: AsyncSession = Depends(get_db)):
    """Create a new load"""
    try:
        import uuid
        load_id = f"CARGA-{str(uuid.uuid4())[:8].upper()}"
        
        new_load = Load(
            id=load_id,
            title=load.title,
            origin=load.origin,
            destination=load.destination,
            value=load.value,
            column_id=load.column_id,
            status="registration"
        )
        
        db.add(new_load)
        await db.commit()
        await db.refresh(new_load)
        
        return {
            "success": True,
            "message": "Carga criada com sucesso",
            "load": {
                "id": new_load.id,
                "title": new_load.title,
                "origin": new_load.origin,
                "destination": new_load.destination,
                "value": new_load.value,
                "column_id": new_load.column_id,
                "created_at": new_load.created_at.isoformat() if new_load.created_at else None
            }
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{load_id}")
async def get_load(load_id: str, db: AsyncSession = Depends(get_db)):
    """Get specific load"""
    try:
        result = await db.execute(
            select(Load)
            .options(joinedload(Load.driver))
            .where(Load.id == load_id)
        )
        load = result.scalars().first()
        
        if not load:
            raise HTTPException(status_code=404, detail="Carga não encontrada")
        
        load_data = {
            "id": load.id,
            "title": load.title,
            "origin": load.origin,
            "destination": load.destination,
            "value": load.value,
            "status": load.status,
            "column_id": load.column_id,
            "driver_id": load.driver_id,
            "payment_status": load.payment_status,
            "created_at": load.created_at.isoformat() if load.created_at else None,
            "driver": None
        }
        
        if load.driver:
            load_data["driver"] = {
                "id": load.driver.id,
                "name": load.driver.name,
                "phone": load.driver.phone,
                "vehicle_type": load.driver.vehicle_type
            }
        
        return load_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{load_id}")
async def update_load(load_id: str, updates: LoadUpdate, db: AsyncSession = Depends(get_db)):
    """Update a load"""
    try:
        result = await db.execute(select(Load).where(Load.id == load_id))
        load = result.scalars().first()
        
        if not load:
            raise HTTPException(status_code=404, detail="Carga não encontrada")
        
        # Update fields
        update_data = updates.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(load, field):
                setattr(load, field, value)
        
        await db.commit()
        await db.refresh(load)
        
        return {
            "success": True,
            "message": "Carga atualizada com sucesso",
            "load": {
                "id": load.id,
                "title": load.title,
                "column_id": load.column_id,
                "status": load.status
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{load_id}")
async def delete_load(load_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a load"""
    try:
        result = await db.execute(select(Load).where(Load.id == load_id))
        load = result.scalars().first()
        
        if not load:
            raise HTTPException(status_code=404, detail="Carga não encontrada")
        
        await db.delete(load)
        await db.commit()
        
        return {
            "success": True,
            "message": "Carga deletada com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))