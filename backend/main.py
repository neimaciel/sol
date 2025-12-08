from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.config import get_settings

settings = get_settings()

from contextlib import asynccontextmanager

async def run_migrations_startup():
    """
    Run migrations automatically on startup.
    Returns dict with status.
    """
    from core.database import SessionLocal
    from sqlalchemy import text
    
    print("🔄 Running startup migrations...")
    
    # Debug DB Connection
    try:
        db_url = settings.DATABASE_URL
        if db_url:
            masked_url = db_url.split("@")[-1] if "@" in db_url else "UNKNOWN"
            print(f"🔌 Attempting to connect to Database at: {masked_url}")
    except Exception as e:
        print(f"⚠️ Could not parse DB URL for logging: {e}")

    
    sql_statements = [
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_type TEXT;",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();",
        
        # Migration 004: Add coordinates to loads
        "ALTER TABLE loads ADD COLUMN IF NOT EXISTS origin_lat FLOAT;",
        "ALTER TABLE loads ADD COLUMN IF NOT EXISTS origin_lon FLOAT;",
        "ALTER TABLE loads ADD COLUMN IF NOT EXISTS destination_lat FLOAT;",
        "ALTER TABLE loads ADD COLUMN IF NOT EXISTS destination_lon FLOAT;",

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
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_candidates_load ON candidates(load_id);",
        "CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);",
        "ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;",
        """
        DO $$ BEGIN
            CREATE POLICY "Service role can do everything on candidates"
                ON candidates FOR ALL
                USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        "GRANT ALL ON candidates TO service_role;",
        
        # Migration 003: Enable public access
        "ALTER TABLE loads ENABLE ROW LEVEL SECURITY;",
        """
        DO $$ BEGIN
            CREATE POLICY "Public can view loads"
                ON loads FOR SELECT
                USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        "ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;",
        """
        DO $$ BEGIN
            CREATE POLICY "Public can insert drivers"
                ON drivers FOR INSERT
                WITH CHECK (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        """
        DO $$ BEGIN
            CREATE POLICY "Public can update own driver info"
                ON drivers FOR UPDATE
                USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        """
        DO $$ BEGIN
            CREATE POLICY "Public can select drivers"
                ON drivers FOR SELECT
                USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        """
        DO $$ BEGIN
            CREATE POLICY "Public can insert candidates"
                ON candidates FOR INSERT
                WITH CHECK (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        """
        DO $$ BEGIN
            CREATE POLICY "Public can view own candidacy"
                ON candidates FOR SELECT
                USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        "GRANT SELECT ON loads TO anon, authenticated;",
        "GRANT ALL ON drivers TO anon, authenticated;",
        "GRANT ALL ON candidates TO anon, authenticated;",
        
        # Migration 005: Add photo to drivers
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS photo TEXT;",
        
        # Migration 006: Add sent_groups to loads
        "ALTER TABLE loads ADD COLUMN IF NOT EXISTS sent_groups JSONB DEFAULT '[]'::jsonb;",
        
        # Migration 007: Fix FK missing between loads and drivers
        """
        DO $$ BEGIN
            -- First, clean up any invalid driver_ids that would cause the FK creation to fail
            UPDATE loads 
            SET driver_id = NULL 
            WHERE driver_id IS NOT NULL 
            AND driver_id NOT IN (SELECT id FROM drivers);

            -- Then add the constraint if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_loads_drivers') THEN
                ALTER TABLE loads 
                ADD CONSTRAINT fk_loads_drivers 
                FOREIGN KEY (driver_id) 
                REFERENCES drivers (id)
                ON DELETE SET NULL;
            END IF;
        END $$;
        """
    ]
    
    async with SessionLocal() as db:
        try:
            for statement in sql_statements:
                await db.execute(text(statement))
            await db.commit()
            print("✅ Startup migrations applied successfully!")
            return {"status": "success", "message": "Migrations applied"}
        except Exception as e:
            await db.rollback()
            print(f"❌ Error running startup migrations: {e}")
            return {"status": "error", "message": str(e)}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await run_migrations_startup()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "SOL Logistics AI Agent is running 🚀"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

from routers import whatsapp, admin, candidates, drivers

app.include_router(whatsapp.router, prefix=f"{settings.API_V1_STR}/whatsapp", tags=["whatsapp"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])
app.include_router(drivers.router, prefix="/api/v1/drivers", tags=["Drivers"])

# Keep manual endpoint just in case, reusing the logic?
# Or remove it to clean up? Let's keep it but make it call the same function if possible, 
# or just keep the code duplicated for now to avoid refactoring too much.
# Actually, I'll remove the manual endpoint since it's automatic now, 
# but user might still want to trigger it manually if startup fails?
# Let's keep it but simplify.

@app.post("/api/v1/system/migrate")
async def run_migrations_manual(db: AsyncSession = Depends(get_db)):
    """
    Manual trigger for migrations.
    """
    await run_migrations_startup()
    return {"message": "Migration triggered"}

@app.get("/api/v1/system/db-check")
async def check_db_connection():
    """
    Debug endpoint to check DB connection from Render.
    """
    import socket
    import os
    
    results = {
        "database_url_set": bool(settings.DATABASE_URL),
        "hostname": None,
        "ip_resolved": None,
        "connection_test": None,
        "error": None
    }
    
    try:
        # Parse Hostname
        db_url = settings.DATABASE_URL
        if db_url and "@" in db_url:
            host_part = db_url.split("@")[-1].split("/")[0]
            if ":" in host_part:
                hostname = host_part.split(":")[0]
                port = int(host_part.split(":")[1])
            else:
                hostname = host_part
                port = 5432
            
            results["hostname"] = hostname
            results["port"] = port
            
            # 1. DNS Resolution
            try:
                ip = socket.gethostbyname(hostname)
                results["ip_resolved"] = ip
            except Exception as e:
                results["dns_error"] = str(e)
                
            # 2. TCP Connection Test
            try:
                sock = socket.create_connection((hostname, port), timeout=5)
                results["tcp_connection"] = "Success"
                sock.close()
            except Exception as e:
                results["tcp_connection"] = f"Failed: {e}"
                
    except Exception as e:
        results["parsing_error"] = str(e)
        
    return results
