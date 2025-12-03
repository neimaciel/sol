import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "SOL Logistics AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Supabase / Database
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    # Construct DB URL from Supabase URL if not provided explicitly
    # This is a placeholder; usually we need the direct connection string (postgres://...)
    # for SQLAlchemy. Supabase provides a connection string in their dashboard.
    # For now, we will assume a DATABASE_URL env var is provided or we construct it.
    DATABASE_URL: str | None = None

    # AI
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # WhatsApp
    EVOLUTION_API_URL: str | None = None
    EVOLUTION_API_KEY: str | None = None
    INSTANCE_NAME: str = "sol_logistica"  # Evolution API instance name

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    from pydantic import field_validator

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            # Auto-fix for SQLAlchemy asyncpg
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://") and "asyncpg" not in v:
                 return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

@lru_cache()
def get_settings():
    return Settings()
