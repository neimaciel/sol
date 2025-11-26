#!/usr/bin/env python3
"""
Script to run database migrations directly using Supabase
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:SUB3IWDTCqYof19v@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres"

async def run_migration():
    print("🔧 Running database migration...")
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # Create drivers table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS drivers (
                id TEXT PRIMARY KEY,
                name TEXT,
                phone TEXT UNIQUE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        print("✅ Created drivers table")
        
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone)")
        
        # Create vehicles table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS vehicles (
                id SERIAL PRIMARY KEY,
                driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                plate TEXT,
                capacity TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        print("✅ Created vehicles table")
        
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON vehicles(driver_id)")
        
        # Create conversations table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                state TEXT DEFAULT 'IDLE',
                data JSONB DEFAULT '{}',
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        print("✅ Created conversations table")
        
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations(state)")
        
        # Enable RLS
        await conn.execute("ALTER TABLE drivers ENABLE ROW LEVEL SECURITY")
        await conn.execute("ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY")
        await conn.execute("ALTER TABLE conversations ENABLE ROW LEVEL SECURITY")
        print("✅ Enabled Row Level Security")
        
        # Create policies
        await conn.execute("""
            DO $$ BEGIN
                CREATE POLICY "Service role can do everything on drivers"
                    ON drivers FOR ALL
                    USING (true);
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        """)
        
        await conn.execute("""
            DO $$ BEGIN
                CREATE POLICY "Service role can do everything on vehicles"
                    ON vehicles FOR ALL
                    USING (true);
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        """)
        
        await conn.execute("""
            DO $$ BEGIN
                CREATE POLICY "Service role can do everything on conversations"
                    ON conversations FOR ALL
                    USING (true);
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        """)
        print("✅ Created RLS policies")
        
        # Grant permissions
        await conn.execute("GRANT ALL ON drivers TO service_role")
        await conn.execute("GRANT ALL ON vehicles TO service_role")
        await conn.execute("GRANT ALL ON conversations TO service_role")
        await conn.execute("GRANT USAGE, SELECT ON SEQUENCE vehicles_id_seq TO service_role")
        print("✅ Granted permissions")
    
    await engine.dispose()
    print("\n🎉 Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_migration())
