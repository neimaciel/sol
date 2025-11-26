from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import get_settings

settings = get_settings()

# Ensure we have a valid database URL. 
# If using Supabase, the connection string is usually:
# postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
# We will default to a placeholder if not set, to avoid crash on startup, 
# but it will fail on connection if not configured.
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL or "postgresql+asyncpg://user:password@localhost/dbname"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True, # Set to False in production
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
