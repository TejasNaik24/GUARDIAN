from typing import List, Dict, Any
import json
from app.agents.agent_base import AgentBase, AgentRequest, AgentResponse
from app.services.llm_client import llm_client
from app.logging.agent_logger import agent_logger
import time

class TriageAgent(AgentBase):
    """
    Agent responsible for determining urgency and next steps.
    """
    
    def __init__(self):
        super().__init__(name="triage_agent")

    async def handle(self, request: AgentRequest) -> AgentResponse:
        start_time = time.time()
        try:
            # Use context if available (e.g. from symptoms agent)
            context_str = ""
            if request.context:
                context_str = f"Context: {json.dumps(request.context)}"
            
            prompt = f"""
            Determine the triage level and next steps for this medical situation.
            User Message: "{request.message}"
            {context_str}
            
            Levels:
            - RED: Life-threatening emergency (Call 911/Emergency)
            - YELLOW: Urgent (Seek medical attention today/Urgent Care)
            - GREEN: Non-urgent (Home care/Routine appointment)
            
            Output JSON ONLY:
            {{
                "level": "RED|YELLOW|GREEN",
                "reasoning": "short explanation",
                "action": "Call 911 | Go to ER | Call Doctor | Home Care",
                "steps": ["step 1", "step 2"]
            }}
            """
            
            response_text = await llm_client.generate_text(prompt, temperature=0.0)
            
            try:
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
            except json.JSONDecodeError:
                data = {
                    "level": "YELLOW", # Default to caution
                    "reasoning": "Could not parse triage result, defaulting to caution.",
                    "action": "Consult a healthcare professional",
                    "steps": []
                }

            # Normalize score based on level
            score_map = {"RED": 1.0, "YELLOW": 0.6, "GREEN": 0.2}
            score = score_map.get(data.get("level", "YELLOW"), 0.5)

            duration = (time.time() - start_time) * 1000
            agent_logger.log_agent_execution(
                self.name,
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                duration,
                True,
                {"level": data.get("level")}
            )

            return AgentResponse(
                agent_name=self.name,
                ok=True,
                result_text=f"Triage Level: {data.get('level')}. {data.get('action')}",
                structured_data=data,
                score=score
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
                result_text=f"Error in triage: {str(e)}"
            )
