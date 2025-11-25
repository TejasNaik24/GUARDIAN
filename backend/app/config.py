"""Application configuration and environment variables"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Google Gemini Configuration
    google_api_key: str
    
    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    
    # RAG Configuration
    vector_db_provider: str = "supabase"
    
    # App Configuration
    environment: str = "development"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
