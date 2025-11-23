"""Health check endpoints"""
from fastapi import APIRouter, Depends
from datetime import datetime
from app.database.supabase_client import get_supabase_client
from supabase import Client

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Simple health check endpoint
    
    Returns:
        Health status and timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Guardian AI Backend"
    }


@router.get("/health/db")
async def database_health(supabase: Client = Depends(get_supabase_client)):
    """
    Check database connectivity
    
    Returns:
        Database health status
    """
    try:
        # Simple query to test connection
        result = supabase.table("conversations").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
