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

@lru_cache()
def get_settings():
    return Settings()
