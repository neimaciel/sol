from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, select
from core.database import get_db
from models.driver import Driver
from models.load import Load
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class LoadSchema(BaseModel):
    id: str
    title: Optional[str] = "Sem título"
    origin: Optional[str] = "Não informado"
    destination: Optional[str] = "Não informado"
    value: Optional[str] = "R$ 0,00"
    status: Optional[str] = "Pendente"
    date: Optional[str] = ""
    column_id: Optional[str] = ""

class DriverProfile(BaseModel):
    driver: dict
    active_load: Optional[LoadSchema]
    history: List[LoadSchema]

@router.get("/{driver_id}/profile", response_model=DriverProfile)
async def get_driver_profile(driver_id: str, db: AsyncSession = Depends(get_db)):
    try:
        clean_id = driver_id.strip()
        print(f"🔍 Fetching profile for driver_id: '{clean_id}' (raw: '{driver_id}')")
        
        # 1. Get Driver Info
        # Use func.trim to handle potential whitespace in DB
        from sqlalchemy import func, or_
        result = await db.execute(
            select(Driver).where(
                or_(
                    Driver.id == clean_id,
                    func.trim(Driver.id) == clean_id,
                    Driver.phone == clean_id # Fallback to phone search
                )
            )
        )
        driver = result.scalars().first()
        
        if not driver:
            print(f"❌ Driver not found for id: '{driver_id}'")
            # Try to list all drivers to see what's in DB (debug only)
            all_drivers = await db.execute(select(Driver.id))
            print(f"📋 Available Driver IDs: {all_drivers.scalars().all()}")
            
            raise HTTPException(status_code=404, detail="Driver not found")
        
        print(f"✅ Driver found: {driver.name} (ID: {driver.id})")
        
        # Convert driver to dict
        driver_data = {
            "id": driver.id,
            "name": driver.name or "Motorista",
            "phone": driver.phone or "",
            "vehicle": driver.vehicle_type or "Não informado",
            "location": "Desconhecido",
            "rating": 5.0,
            "photo": driver.photo or "https://i.pravatar.cc/150",
            "status": "available"
        }
        
        # 2. Get Active Load (not completed)
        load_result = await db.execute(
            select(Load).where(
                Load.driver_id == driver_id,
                Load.column_id != "completed"
            )
        )
        active_load = load_result.scalars().first()
        
        active_load_data = None
        if active_load:
            active_load_data = LoadSchema(
                id=active_load.id,
                title=active_load.title,
                origin=active_load.origin,
                destination=active_load.destination,
                value=active_load.value,
                status=active_load.status or "Em andamento",
                date=str(active_load.created_at) if active_load.created_at else "",
                column_id=active_load.column_id
            )
            driver_data["status"] = "busy"
        
        # 3. Get History (completed loads)
        history_result = await db.execute(
            select(Load).where(
                Load.driver_id == driver_id,
                Load.column_id == "completed"
            ).order_by(desc(Load.created_at))
        )
        history_loads = history_result.scalars().all()
        
        history_data = [
            LoadSchema(
                id=load.id,
                title=load.title,
                origin=load.origin,
                destination=load.destination,
                value=load.value,
                status="Concluído",
                date=str(load.created_at) if load.created_at else "",
                column_id=load.column_id
            ) for load in history_loads
        ]
        
        return DriverProfile(
            driver=driver_data,
            active_load=active_load_data,
            history=history_data
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ Error in get_driver_profile: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
