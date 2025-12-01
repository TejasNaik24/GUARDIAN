from typing import List, Dict, Any
import json
from app.agents.agent_base import AgentBase, AgentRequest, AgentResponse
from app.services.llm_client import llm_client
from app.logging.agent_logger import agent_logger
import time

class PediatricAgent(AgentBase):
    """
    Agent responsible for pediatric-specific advice.
    """
    
    def __init__(self):
        super().__init__(name="pediatric_agent")

    async def handle(self, request: AgentRequest) -> AgentResponse:
        start_time = time.time()
        try:
            prompt = f"""
            You are a pediatric medical assistant.
            User Message: "{request.message}"
            
            1. Check if the age of the child is mentioned.
            2. If NOT mentioned, your primary action is to ASK FOR THE AGE.
            3. If mentioned, provide age-appropriate advice.
            
            Output JSON ONLY:
            {{
                "age_detected": "age string or null",
                "needs_age_clarification": true/false,
                "advice": "advice string",
                "special_considerations": ["list of considerations"]
            }}
            """
            
            response_text = await llm_client.generate_text(prompt, temperature=0.2)
            
            try:
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
            except json.JSONDecodeError:
                data = {
                    "age_detected": None,
                    "needs_age_clarification": True,
                    "advice": "Please specify the age of the child so I can provide accurate advice.",
                    "special_considerations": []
                }

            duration = (time.time() - start_time) * 1000
            agent_logger.log_agent_execution(
                self.name,
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                duration,
                True,
                {"needs_clarification": data.get("needs_age_clarification")}
            )

            return AgentResponse(
                agent_name=self.name,
                ok=True,
                result_text=data.get("advice", ""),
                structured_data=data,
                score=1.0
            )

        except Exception as e:
            duration = (time.time() - start_time) * 1000
            agent_logger.log_agent_execution(
                self.name,
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                duration,
                False,
                {"error": str(e)}
            )
            return AgentResponse(
                agent_name=self.name,
                ok=False,
                result_text=f"Error in pediatric agent: {str(e)}"
            )
