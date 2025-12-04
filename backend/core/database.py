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

# FORCE IPv4 FIX:
# Render sometimes fails to route IPv6 correctly to Supabase.
# We resolve the hostname to an IPv4 address manually.
connect_args = {}
try:
    if "postgres" in SQLALCHEMY_DATABASE_URL and "@" in SQLALCHEMY_DATABASE_URL:
        # Parse URL
        # We need to handle the scheme carefully because urlparse expects standard schemes
        # but sqlalchemy uses +asyncpg etc.
        # Simple parsing:
        scheme_end = SQLALCHEMY_DATABASE_URL.find("://")
        scheme = SQLALCHEMY_DATABASE_URL[:scheme_end]
        rest = SQLALCHEMY_DATABASE_URL[scheme_end+3:]
        
        if "@" in rest:
            auth_part, location_part = rest.split("@", 1)
            if "/" in location_part:
                host_port, db_path = location_part.split("/", 1)
            else:
                host_port = location_part
                db_path = ""
            
            if ":" in host_port:
                hostname, port = host_port.split(":")
            else:
                hostname = host_port
                port = "5432" # Default
            
            # Resolve to IPv4
            print(f"🔍 Resolving DB Host: {hostname}")
            ipv4 = socket.gethostbyname(hostname)
            print(f"✅ Resolved to IPv4: {ipv4}")
            
            # Reconstruct URL with IP
            # We must disable SSL hostname check because IP won't match cert
            new_location = f"{auth_part}@{ipv4}:{port}/{db_path}"
            SQLALCHEMY_DATABASE_URL = f"{scheme}://{new_location}"
            
            # Configure SSL to ignore hostname mismatch
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE # Trust the server (required for IP connection)
            
            # Fix for Supabase Transaction Pooler (pgbouncer)
            # asyncpg tries to use prepared statements which fail in transaction mode
            connect_args = {
                "ssl": ssl_context,
                "statement_cache_size": 0,
                "prepared_statement_cache_size": 0
            }
            print("🛡️ SSL Hostname verification disabled & Prepared Statements disabled for Pooler")

except Exception as e:
    print(f"⚠️ Failed to force IPv4: {e}")
    # Fallback to original URL but still disable prepared statements for Pooler compatibility
    connect_args = {"statement_cache_size": 0, "prepared_statement_cache_size": 0}
    pass

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True, # Set to False in production
    connect_args=connect_args
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
