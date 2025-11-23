"""Conversation data models"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class Conversation(BaseModel):
    """Conversation model"""
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    """Schema for creating a new conversation"""
    user_id: str
    title: str = "New Conversation"


class ConversationUpdate(BaseModel):
    """Schema for updating conversation"""
    title: Optional[str] = None


class ConversationResponse(BaseModel):
    """Response schema for conversation"""
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
