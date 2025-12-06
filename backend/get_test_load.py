import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Using the Pooler URL that we know works (or the direct one if pooler fails locally, but user said local works)
# User said local works with the credentials in setup_vercel_env.sh
DATABASE_URL = "postgresql+asyncpg://postgres:SUB3IWDTCqYof19v@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres"

async def get_load_id():
    try:
        engine = create_async_engine(DATABASE_URL, echo=False)
        async with engine.connect() as conn:
            # Try to find an existing load
            result = await conn.execute(text("SELECT id FROM loads LIMIT 1;"))
            load_id = result.scalar()
            
            if load_id:
                print(f"✅ Found Load ID: {load_id}")
            else:
                print("⚠️ No loads found. Creating a test load...")
                # Create a test load
                await conn.execute(text("""
                    INSERT INTO loads (id, origin, destination, value, status, column_id)
                    VALUES ('TEST-123', 'São Paulo, SP', 'Rio de Janeiro, RJ', 'R$ 5.000,00', 'active', 'registration')
                    ON CONFLICT (id) DO NOTHING;
                """))
                await conn.commit()
                print(f"✅ Created/Found Test Load ID: TEST-123")
            
    except Exception as e:
        print(f"❌ Failed to get load: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(get_load_id())
