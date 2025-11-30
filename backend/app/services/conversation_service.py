"""Conversation and message management service"""
from typing import List, Optional
from datetime import datetime
from app.database.supabase_client import get_supabase_client
from app.models.conversation import Conversation, ConversationCreate
from app.models.message import Message, MessageCreate
from app.services.gemini_service import GeminiService
from app.utils.logger import setup_logger
import uuid

logger = setup_logger()


class ConversationService:
    """Service for managing conversations and messages"""
    
    def __init__(self):
        """Initialize conversation service"""
        self.supabase = get_supabase_client()
        self.gemini_service = GeminiService()
    
    async def create_conversation(
        self,
        user_id: str,
        title: str = "New Conversation"
    ) -> Conversation:
        """
        Create new conversation
        
        Args:
            user_id: ID of user creating conversation
            title: Conversation title
            
        Returns:
            Created conversation
        """
        try:
            conversation_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            
            data = {
                "id": conversation_id,
                "user_id": user_id,
                "title": title,
                "created_at": now,
                "updated_at": now
            }
            
            result = self.supabase.table("conversations").insert(data).execute()
            
            logger.info(f"✅ Created conversation: {conversation_id}")
            return Conversation(**result.data[0])
            
        except Exception as e:
            logger.error(f"❌ Error creating conversation: {str(e)}")
            raise
    
    async def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """
        Get conversation by ID
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            Conversation or None if not found
        """
        try:
            result = self.supabase.table("conversations").select("*").eq("id", conversation_id).execute()
            
            if not result.data:
                return None
            
            return Conversation(**result.data[0])
            
        except Exception as e:
            logger.error(f"❌ Error getting conversation: {str(e)}")
            return None
    
    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Conversation]:
        """
        Get all conversations for a user
        
        Args:
            user_id: User identifier
            limit: Maximum conversations to return
            
        Returns:
            List of conversations
        """
        try:
            result = self.supabase.table("conversations") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("updated_at", desc=True) \
                .limit(limit) \
                .execute()
            
            return [Conversation(**conv) for conv in result.data]
            
        except Exception as e:
            logger.error(f"❌ Error getting user conversations: {str(e)}")
            return []
    
    async def update_conversation_title(
        self,
        conversation_id: str,
        title: str
    ) -> bool:
        """
        Update conversation title
        
        Args:
            conversation_id: Conversation identifier
            title: New title
            
        Returns:
            True if successful
        """
        try:
            self.supabase.table("conversations") \
                .update({"title": title, "updated_at": datetime.utcnow().isoformat()}) \
                .eq("id", conversation_id) \
                .execute()
            
            logger.info(f"✅ Updated conversation title: {conversation_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error updating conversation title: {str(e)}")
            return False
    
    async def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str
    ) -> Message:
        """
        Save message to conversation
        
        Args:
            conversation_id: Conversation identifier
            role: Message role (user/assistant/system)
            content: Message content
            
        Returns:
            Created message
        """
        try:
            message_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            
            data = {
                "id": message_id,
                "conversation_id": conversation_id,
                "role": role,
                "content": content,
                "created_at": now
            }
            
            result = self.supabase.table("messages").insert(data).execute()
            
            # Update conversation timestamp
            self.supabase.table("conversations") \
                .update({"updated_at": now}) \
                .eq("id", conversation_id) \
                .execute()
            
            logger.info(f"✅ Saved {role} message to conversation: {conversation_id}")
            return Message(**result.data[0])
            
        except Exception as e:
            logger.error(f"❌ Error saving message: {str(e)}")
            raise
    
    async def get_conversation_messages(
        self,
        conversation_id: str
    ) -> List[Message]:
        """
        Get all messages in a conversation
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            List of messages ordered by creation time
        """
        try:
            result = self.supabase.table("messages") \
                .select("*") \
                .eq("conversation_id", conversation_id) \
                .order("created_at", desc=False) \
                .execute()
            
            return [Message(**msg) for msg in result.data]
            
        except Exception as e:
            logger.error(f"❌ Error getting messages: {str(e)}")
            return []
    
    async def generate_title(self, first_message: str) -> str:
        """
        Auto-generate conversation title from first message
        
        Args:
            first_message: First user message in conversation
            
        Returns:
            Generated title
        """
        try:
            title = await self.gemini_service.generate_title(first_message)
            return title
        except Exception as e:
            logger.error(f"❌ Error generating title: {str(e)}")
            return "New Conversation"

    async def get_or_create_guest_user(self) -> str:
        """
        Get or create a guest user for anonymous sessions
        
        Returns:
            Guest user ID
        """
        email = "guest@guardian.ai"
        # Use a consistent password or random one, doesn't matter as no one logs in as this user
        password = "GuestUserSecurePassword123!" 
        
        try:
            # Try to create user
            # Note: create_user returns a UserResponse object usually
            response = self.supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True
            })
            
            # Handle different response structures depending on supabase version
            user = getattr(response, 'user', None) or response
            user_id = getattr(user, 'id', None)
            
            if user_id:
                logger.info(f"✅ Created guest user: {user_id}")
                return user_id
            
            raise Exception("Failed to get ID from created user")
            
        except Exception as e:
            error_str = str(e).lower()
            if "already registered" in error_str or "unique constraint" in error_str:
                logger.info("ℹ️ Guest user exists, retrieving ID...")
                try:
                    # List users to find the guest user
                    # Note: This might be slow if there are many users, but robust for now
                    response = self.supabase.auth.admin.list_users()
                    users = getattr(response, 'users', []) or response
                    
                    for user in users:
                        if getattr(user, 'email', '') == email:
                            return getattr(user, 'id')
                            
                    raise Exception("Guest user exists but could not be found in list")
                except Exception as inner_e:
                    logger.error(f"❌ Error finding guest user: {str(inner_e)}")
                    raise
            
            logger.error(f"❌ Error creating guest user: {str(e)}")
            raise
