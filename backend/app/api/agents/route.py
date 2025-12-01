from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.agents.main_agent import main_agent
from app.agents.agent_base import AgentRequest

router = APIRouter()

class AgentQueryRequest(BaseModel):
    message: str
    image_base64: Optional[str] = None
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None

class AgentQueryResponse(BaseModel):
    final_text: str
    agent_trace: List[Dict[str, Any]]
    citations: List[Dict[str, Any]]
    urgency_level: str

@router.post("/query", response_model=AgentQueryResponse)
async def query_agents(request: AgentQueryRequest):
    """
    Process a query through the multi-agent system.
    """
    try:
        agent_req = AgentRequest(
            message=request.message,
            image_base64=request.image_base64,
            conversation_id=request.conversation_id,
            user_id=request.user_id
        )
        
        result = await main_agent.handle(agent_req)
        
        return AgentQueryResponse(
            final_text=result.get("final_text", ""),
            agent_trace=result.get("agent_trace", []),
            citations=result.get("citations", []),
            urgency_level=result.get("urgency_level", "GREEN")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
