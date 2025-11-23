"""Message data models"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal


class Message(BaseModel):
    """Message model"""
    id: str
    conversation_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    """Schema for creating a new message"""
    conversation_id: str
    role: Literal["user", "assistant", "system"]
    content: str


class MessageResponse(BaseModel):
    """Response schema for message"""
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime


class ChatRequest(BaseModel):
    """Request schema for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response schema for chat endpoint"""
    conversation_id: str
    message: str
    role: str = "assistant"
    sources: Optional[list] = []
