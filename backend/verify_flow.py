import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

# Mock Env Vars BEFORE imports
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_KEY"] = "mock-key"
os.environ["GEMINI_API_KEY"] = "mock-key"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

# Setup Test DB BEFORE importing services
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession)

# Override database module
from core import database
database.engine = test_engine
database.SessionLocal = TestingSessionLocal

async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

database.get_db = override_get_db

# Now import services
from services.conversation_service import conversation_service
from services.whatsapp_service import whatsapp_service
from services.ai_service import ai_service
from core.database import Base

# Mock External Services
whatsapp_service.send_message = AsyncMock()
ai_service.analyze_intent = AsyncMock(return_value="REGISTER_VEHICLE") # Default intent for first msg
ai_service.generate_response = AsyncMock(return_value="Mock AI Response")

async def run_verification():
    print("🚀 Starting Verification Flow...")

    # Create Tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    remote_jid = "5511999999999"

    # Step 1: User sends "Quero me cadastrar"
    print("\n--- Step 1: User sends 'Quero me cadastrar' ---")
    ai_service.analyze_intent.return_value = "REGISTER_VEHICLE"
    await conversation_service.handle_message(remote_jid, "Quero me cadastrar")
    
    # Verify Response
    args, _ = whatsapp_service.send_message.call_args
    print(f"Bot Response: {args[1]}")
    assert "nome completo" in args[1]

    # Step 2: User sends Name
    print("\n--- Step 2: User sends 'João Silva' ---")
    await conversation_service.handle_message(remote_jid, "João Silva")
    
    # Verify Response
    args, _ = whatsapp_service.send_message.call_args
    print(f"Bot Response: {args[1]}")
    assert "tipo do seu veículo" in args[1]

    # Step 3: User sends Vehicle
    print("\n--- Step 3: User sends 'Caminhão Truck' ---")
    await conversation_service.handle_message(remote_jid, "Caminhão Truck")
    
    # Verify Response
    args, _ = whatsapp_service.send_message.call_args
    print(f"Bot Response: {args[1]}")
    assert "Cadastro realizado" in args[1]

    # Verify DB
    async with TestingSessionLocal() as db:
        from models.driver import Driver
        from models.vehicle import Vehicle
        from sqlalchemy import select
        
        driver = (await db.execute(select(Driver).where(Driver.id == remote_jid))).scalar_one_or_none()
        vehicle = (await db.execute(select(Vehicle).where(Vehicle.driver_id == remote_jid))).scalar_one_or_none()
        
        print(f"\n✅ DB Verification:")
        print(f"Driver: {driver.name} ({driver.phone})")
        print(f"Vehicle: {vehicle.type}")
        
        assert driver.name == "João Silva"
        assert vehicle.type == "Caminhão Truck"

    print("\n🎉 Verification Successful!")

if __name__ == "__main__":
    asyncio.run(run_verification())
