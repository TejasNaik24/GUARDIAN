"""Supabase client initialization and management"""
from supabase import create_client, Client
from functools import lru_cache
from app.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get cached Supabase client instance
    
    Returns:
        Initialized Supabase client
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key
    )


def get_supabase_anon_client() -> Client:
    """
    Get Supabase client with anon key for public operations
    
    Returns:
        Supabase client with anon key
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_anon_key
    )
