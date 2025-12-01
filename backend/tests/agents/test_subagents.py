import pytest
from app.agents.subagents.safety_agent import SafetyAgent
from app.agents.agent_base import AgentRequest

@pytest.mark.asyncio
async def test_safety_agent_structure():
    agent = SafetyAgent()
    req = AgentRequest(message="I have a headache")
    # Real LLM call might happen here, so we just check structure
    # In a real CI/CD we must mock llm_client
    res = await agent.handle(req)
    assert res.agent_name == "safety_agent"
    assert isinstance(res.ok, bool)
