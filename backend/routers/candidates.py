from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from core.database import get_db
from models import Candidate, Driver, Load
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter()

class DriverInput(BaseModel):
    name: str
    phone: str
    vehicle_type: str
    vehicle_plate: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    photo: Optional[str] = None

class ApplyRequest(BaseModel):
    load_id: str
    driver: DriverInput

class CandidateResponse(BaseModel):
    id: uuid.UUID
    load_id: str
    driver_id: str
    status: str
    driver: DriverInput
    chat_messages: Optional[List[dict]] = []
    created_at: str

    class Config:
        orm_mode = True

@router.post("/apply")
async def apply_for_load(request: ApplyRequest, db: AsyncSession = Depends(get_db)):
    """
    Driver applies for a load.
    Creates/Updates driver and creates candidate record.
    Moves load to 'atendimento' if it's the first candidate.
    """
    try:
        # 0. Validate Load Status
        # Fetch load first to ensure it exists and is in a valid stage
        load_result = await db.execute(select(Load).where(Load.id == request.load_id))
        load = load_result.scalars().first()
        
        if not load:
            raise HTTPException(status_code=404, detail="Load not found")
            
        # Rule: Only accept applications in the first 3 stages
        allowed_columns = ['registration', 'broadcast', 'initial_service']
        if load.column_id not in allowed_columns:
             raise HTTPException(status_code=400, detail="Esta carga não está mais recebendo candidaturas.")

        # 1. Upsert Driver
        # Sanitize phone number to use as ID (remove all non-digits)
        import re
        clean_phone = re.sub(r'\D', '', request.driver.phone)
        
        # Check if driver exists by ID (which is the phone)
        result = await db.execute(select(Driver).where(Driver.id == clean_phone))
        driver = result.scalars().first()

        # Try to fetch profile picture from WhatsApp
        from services.whatsapp_service import whatsapp_service
        profile_pic = await whatsapp_service.get_profile_picture(clean_phone)

        if driver:
            # Update existing driver info
            driver.name = request.driver.name
            driver.vehicle_type = request.driver.vehicle_type
            driver.phone = request.driver.phone # Update formatted phone if needed
            if request.driver.vehicle_plate:
                driver.vehicle_plate = request.driver.vehicle_plate
            if request.driver.cpf_cnpj:
                driver.cpf_cnpj = request.driver.cpf_cnpj
            if profile_pic:
                driver.photo = profile_pic
        else:
            # Create new driver
            driver = Driver(
                id=clean_phone,
                name=request.driver.name,
                phone=request.driver.phone,
                vehicle_type=request.driver.vehicle_type,
                vehicle_plate=request.driver.vehicle_plate,
                cpf_cnpj=request.driver.cpf_cnpj,
                photo=profile_pic
            )
            db.add(driver)
        
        await db.flush()

        # 2. Check if already applied
        result = await db.execute(
            select(Candidate).where(
                Candidate.load_id == request.load_id,
                Candidate.driver_id == driver.id
            )
        )
        existing_candidate = result.scalars().first()

        if existing_candidate:
            return {"message": "Already applied", "candidate_id": existing_candidate.id}

        # 3. Create Candidate
        candidate = Candidate(
            load_id=request.load_id,
            driver_id=driver.id,
            status="pending"
        )
        db.add(candidate)

        # 4. Auto-transition Load
        # Use the already fetched load object
        if load.column_id == 'registration':
            load.column_id = 'atendimento'
                
        await db.commit()
        return {"message": "Application successful", "candidate_id": candidate.id}

    except Exception as e:
        import traceback
        print(f"❌ Error applying for load: {e}")
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/by-load/{load_id}", response_model=List[CandidateResponse])
async def get_candidates_by_load(load_id: str, db: AsyncSession = Depends(get_db)):
    """
    List all candidates for a specific load.
    """
    result = await db.execute(
        select(Candidate)
        .options(selectinload(Candidate.driver)) # Eager load driver
        .where(Candidate.load_id == load_id)
    )
    candidates = result.scalars().all()
    return candidates

@router.post("/{candidate_id}/select")
async def select_candidate(candidate_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Select a candidate for the load.
    Moves load to 'documentacao'.
    """
    # Get candidate
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalars().first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Update status
    candidate.status = "selected"
    
    # Reject others
    await db.execute(
        update(Candidate)
        .where(Candidate.load_id == candidate.load_id, Candidate.id != candidate_id)
        .values(status="rejected")
    )
    
    # Move load to 'documentacao'
    # First get the load to ensure it exists and update it
    load_result = await db.execute(select(Load).where(Load.id == candidate.load_id))
    load = load_result.scalars().first()
    
    if load:
        load.column_id = 'documentacao'
    
    await db.commit()
    return {"message": "Candidate selected"}

@router.post("/by-load/{load_id}/unassign")
async def unassign_driver(load_id: str, db: AsyncSession = Depends(get_db)):
    """
    Unassign the current driver from the load.
    Reverts load to 'initial_service' and candidate to 'pending'.
    """
    # Get load
    load_result = await db.execute(select(Load).where(Load.id == load_id))
    load = load_result.scalars().first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    if not load.driver_id:
        raise HTTPException(status_code=400, detail="No driver assigned to this load")

    # Find the selected candidate
    candidate_result = await db.execute(
        select(Candidate).where(
            Candidate.load_id == load_id,
            Candidate.driver_id == load.driver_id,
            Candidate.status == 'selected'
        )
    )
    candidate = candidate_result.scalars().first()
    
    # Revert candidate status
    if candidate:
        candidate.status = 'pending'
        
    # Clear driver from load and reset column
    load.driver_id = None
    load.column_id = 'initial_service'
    
    # Optional: We could also revert other 'rejected' candidates to 'pending' if we wanted,
    # but keeping them rejected is also fine. Let's stick to just the selected one for now.
    
    await db.commit()
    return {"message": "Driver unassigned successfully"}
