import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Credentials from setup_vercel_env.sh
DATABASE_URL = "postgresql+asyncpg://postgres:SUB3IWDTCqYof19v@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres"

async def test_connection():
    print(f"🔌 Testing connection to: {DATABASE_URL.split('@')[1]}") # Hide password in logs
    
    try:
        engine = create_async_engine(DATABASE_URL, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"✅ Connection Successful!")
            print(f"📊 Database Version: {version}")
            
            # Test table access
            print("🔍 Checking tables...")
            result = await conn.execute(text("SELECT count(*) FROM drivers;"))
            count = result.scalar()
            print(f"✅ Drivers table accessible. Count: {count}")
            
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())
