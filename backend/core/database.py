from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import get_settings

settings = get_settings()

# Ensure we have a valid database URL. 
# If using Supabase, the connection string is usually:
# postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
# We will default to a placeholder if not set, to avoid crash on startup, 
# but it will fail on connection if not configured.
import socket
import ssl
from urllib.parse import urlparse, urlunparse

# Ensure we have a valid database URL. 
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL or "postgresql+asyncpg://user:password@localhost/dbname"

# Fix for Supabase Transaction Pooler (pgbouncer)
# asyncpg tries to use prepared statements which fail in transaction mode
connect_args = {
    "statement_cache_size": 0
}

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False, # Disable logging to prevent IO in error handlers
    pool_pre_ping=True, # Enable connection health checks
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
