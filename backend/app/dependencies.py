"""Dependency injection for FastAPI routes"""
from fastapi import Depends, HTTPException, Header
from typing import Optional
from app.config import get_settings, Settings
from app.database.supabase_client import get_supabase_client
from supabase import Client


async def get_current_user(
    authorization: Optional[str] = Header(None),
    supabase: Client = Depends(get_supabase_client)
) -> dict:
    """
    Validate JWT token and return current user
    
    Args:
        authorization: Bearer token from Authorization header
        supabase: Supabase client instance
        
    Returns:
        User data dictionary
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    supabase: Client = Depends(get_supabase_client)
) -> Optional[dict]:
    """
    Get current user if authenticated, otherwise return None
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception:
        return None


def get_settings_dependency() -> Settings:
    """Get application settings"""
    return get_settings()
