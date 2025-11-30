import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

# Get DB URL from env or use the one from run_migration.py
DATABASE_URL = "postgresql+asyncpg://postgres:SUB3IWDTCqYof19v@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres"

async def apply_migration():
    print("🔧 Applying migration 002...")
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    statements = [
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_type TEXT",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_plate TEXT",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()",
        """
        CREATE TABLE IF NOT EXISTS candidates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            load_id TEXT NOT NULL,
            driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'pending',
            chat_messages JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(load_id, driver_id)
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_candidates_load ON candidates(load_id)",
        "CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status)",
        "ALTER TABLE candidates ENABLE ROW LEVEL SECURITY",
        """
        DO $$ BEGIN
            CREATE POLICY "Service role can do everything on candidates"
                ON candidates FOR ALL
                USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
        """,
        "GRANT ALL ON candidates TO service_role"
    ]
        
    async with engine.begin() as conn:
        for statement in statements:
            if statement.strip():
                print(f"Executing: {statement[:50]}...")
                await conn.execute(text(statement))
                
    print("✅ Migration 002 applied successfully!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(apply_migration())
