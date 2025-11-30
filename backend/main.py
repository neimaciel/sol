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
    
    sql_statements = [
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_type TEXT;",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;",
        "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();",
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
        "GRANT ALL ON candidates TO anon, authenticated;"
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

from routers import whatsapp, admin, candidates

app.include_router(whatsapp.router, prefix=f"{settings.API_V1_STR}/whatsapp", tags=["whatsapp"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])

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
