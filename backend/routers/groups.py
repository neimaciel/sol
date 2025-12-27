from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from core.database import get_db
from models.group import Group
from pydantic import BaseModel
from typing import Optional, List
import uuid

router = APIRouter()

class GroupCreate(BaseModel):
    name: str
    type: str = "Frota Própria"
    description: Optional[str] = None
    region: Optional[str] = None
    whatsapp_link: Optional[str] = None
    whatsapp_id: Optional[str] = None

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    region: Optional[str] = None
    whatsapp_link: Optional[str] = None
    whatsapp_id: Optional[str] = None
    members_count: Optional[int] = None

class GroupResponse(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str] = None
    region: Optional[str] = None
    whatsapp_link: Optional[str] = None
    whatsapp_id: Optional[str] = None
    members_count: int
    created_at: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[GroupResponse])
async def list_groups(db: AsyncSession = Depends(get_db)):
    """List all groups"""
    try:
        result = await db.execute(
            select(Group).order_by(desc(Group.created_at))
        )
        groups = result.scalars().all()
        
        return [
            GroupResponse(
                id=group.id,
                name=group.name,
                type=group.type,
                description=group.description,
                region=group.region,
                whatsapp_link=group.whatsapp_link,
                whatsapp_id=group.whatsapp_id,
                members_count=group.members_count,
                created_at=group.created_at.isoformat() if group.created_at else ""
            ) for group in groups
        ]
    except Exception as e:
        print(f"Error listing groups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=GroupResponse)
async def create_group(group_data: GroupCreate, db: AsyncSession = Depends(get_db)):
    """Create a new group"""
    try:
        new_group = Group(
            id=str(uuid.uuid4()),
            name=group_data.name,
            type=group_data.type,
            description=group_data.description,
            region=group_data.region,
            whatsapp_link=group_data.whatsapp_link,
            whatsapp_id=group_data.whatsapp_id,
            members_count=0
        )
        
        db.add(new_group)
        await db.commit()
        await db.refresh(new_group)
        
        return GroupResponse(
            id=new_group.id,
            name=new_group.name,
            type=new_group.type,
            description=new_group.description,
            region=new_group.region,
            whatsapp_link=new_group.whatsapp_link,
            whatsapp_id=new_group.whatsapp_id,
            members_count=new_group.members_count,
            created_at=new_group.created_at.isoformat() if new_group.created_at else ""
        )
    except Exception as e:
        print(f"Error creating group: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(group_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific group by ID"""
    try:
        result = await db.execute(
            select(Group).where(Group.id == group_id)
        )
        group = result.scalar_one_or_none()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        return GroupResponse(
            id=group.id,
            name=group.name,
            type=group.type,
            description=group.description,
            region=group.region,
            whatsapp_link=group.whatsapp_link,
            whatsapp_id=group.whatsapp_id,
            members_count=group.members_count,
            created_at=group.created_at.isoformat() if group.created_at else ""
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting group: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(group_id: str, group_data: GroupUpdate, db: AsyncSession = Depends(get_db)):
    """Update a group"""
    try:
        result = await db.execute(
            select(Group).where(Group.id == group_id)
        )
        group = result.scalar_one_or_none()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Update fields if provided
        if group_data.name is not None:
            group.name = group_data.name
        if group_data.type is not None:
            group.type = group_data.type
        if group_data.description is not None:
            group.description = group_data.description
        if group_data.region is not None:
            group.region = group_data.region
        if group_data.whatsapp_link is not None:
            group.whatsapp_link = group_data.whatsapp_link
        if group_data.whatsapp_id is not None:
            group.whatsapp_id = group_data.whatsapp_id
        if group_data.members_count is not None:
            group.members_count = group_data.members_count
        
        await db.commit()
        await db.refresh(group)
        
        return GroupResponse(
            id=group.id,
            name=group.name,
            type=group.type,
            description=group.description,
            region=group.region,
            whatsapp_link=group.whatsapp_link,
            whatsapp_id=group.whatsapp_id,
            members_count=group.members_count,
            created_at=group.created_at.isoformat() if group.created_at else ""
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating group: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{group_id}")
async def delete_group(group_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a group"""
    try:
        result = await db.execute(
            select(Group).where(Group.id == group_id)
        )
        group = result.scalar_one_or_none()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        await db.delete(group)
        await db.commit()
        
        return {"success": True, "message": "Group deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting group: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))