from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from abc import ABC, abstractmethod

class AgentRequest(BaseModel):
    """Standard request object for all agents"""
    user_id: Optional[str] = None
    message: str
    image_base64: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    conversation_id: Optional[str] = None

class AgentResponse(BaseModel):
    """Standard response object from all agents"""
    agent_name: str
    ok: bool
    result_text: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    citations: Optional[List[Dict[str, Any]]] = None
    score: Optional[float] = None
    diagnostics: Optional[Dict[str, Any]] = None
    invoked_subagents: Optional[List[str]] = None

class AgentBase(ABC):
    """Abstract base class for all agents"""
    
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def handle(self, request: AgentRequest) -> AgentResponse:
        """Process the request and return a response"""
        pass
