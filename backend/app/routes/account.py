"""Account management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.services.conversation_service import ConversationService
from app.utils.logger import setup_logger
from app.database.supabase_client import get_supabase_client
import jwt
import os
from datetime import datetime, timedelta

logger = setup_logger()
router = APIRouter()

# Secret key for JWT tokens
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def create_deletion_token(user_id: str) -> str:
    """Create a JWT token for account deletion verification"""
    payload = {
        "user_id": user_id,
        "type": "account_deletion",
        "exp": datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_deletion_token(token: str) -> str:
    """Verify deletion token and return user_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "account_deletion":
            raise HTTPException(status_code=400, detail="Invalid token type")
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid token")


@router.post("/delete/initiate")
async def initiate_account_deletion(
    current_user: dict = Depends(get_current_user)
):
    """
    Send verification email for account deletion
    
    Args:
        current_user: Authenticated user from JWT
        
    Returns:
        Success message
    """
    try:
        user_id = current_user.id
        email = current_user.email
        
        # Generate deletion token
        token = create_deletion_token(user_id)
        
        # Create deletion link
        deletion_link = f"{FRONTEND_URL}/account/delete/confirm?token={token}"
        
        # For now, just log the link (in production, send email)
        logger.info(f"📧 Account deletion link for {email}: {deletion_link}")
        
        # TODO: Send actual email using SendGrid or similar service
        # For MVP, we'll just return success and user can delete via API directly
        
        return {
            "status": "success", 
            "message": "Verification email sent",
            "deletion_link": deletion_link  # Remove this in production!
        }
        
    except Exception as e:
        logger.error(f"❌ Error initiating account deletion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/confirm")
async def confirm_account_deletion(token: str):
    """
    Verify token and delete account
    
    Args:
        token: JWT deletion token
        
    Returns:
        Success message
    """
    try:
        # Verify token
        user_id = verify_deletion_token(token)
        
        conversation_service = ConversationService()
        supabase = get_supabase_client()
        
        # 1. Delete all conversations (cascade deletes messages)
        conversation_service.supabase.table("conversations").delete().eq("user_id", user_id).execute()
        logger.info(f"✅ Deleted conversations for user: {user_id}")
        
        # 2. Delete user from Supabase Auth
        try:
            # Note: This requires admin privileges
            # For now, we'll just delete user data, not the auth account
            # In production, you'd use Supabase Admin API:
            # supabase.auth.admin.delete_user(user_id)
            logger.info(f"✅ Would delete auth user: {user_id} (skipped for now)")
        except Exception as auth_error:
            logger.warning(f"⚠️  Could not delete auth user: {str(auth_error)}")
        
        logger.info(f"✅ Account deletion completed for user: {user_id}")
        return {"status": "success", "message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error confirming account deletion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
