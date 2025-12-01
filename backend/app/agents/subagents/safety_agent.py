from typing import List, Dict, Any
import json
from app.agents.agent_base import AgentBase, AgentRequest, AgentResponse
from app.services.llm_client import llm_client
from app.logging.agent_logger import agent_logger
import time

class SafetyAgent(AgentBase):
    """
    Agent responsible for validating inputs and outputs for safety.
    """
    
    def __init__(self):
        super().__init__(name="safety_agent")

    async def handle(self, request: AgentRequest) -> AgentResponse:
        start_time = time.time()
        try:
            # If checking a response from another agent (passed in context or metadata), validate it.
            # But typically this runs first on the user message.
            
            prompt = f"""
            Analyze this message for safety violations.
            Message: "{request.message}"
            
            Violations to check:
            1. Self-harm or suicide.
            2. Violence or illegal acts.
            3. Request for specific prescription dosages (without context).
            4. Non-medical topics (strict refusal).
            
            Output JSON ONLY:
            {{
                "is_safe": true/false,
                "violation_type": "self_harm|violence|non_medical|none",
                "reason": "explanation",
                "suggested_response": "response if unsafe"
            }}
            """
            
            response_text = await llm_client.generate_text(prompt, temperature=0.0)
            
            try:
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
            except json.JSONDecodeError:
                # Fail safe
                data = {
                    "is_safe": False,
                    "violation_type": "error",
                    "reason": "Could not validate safety",
                    "suggested_response": "I cannot process this request at the moment."
                }

            duration = (time.time() - start_time) * 1000
            agent_logger.log_agent_execution(
                self.name,
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                duration,
                True,
                {"is_safe": data.get("is_safe")}
            )

            return AgentResponse(
                agent_name=self.name,
                ok=data.get("is_safe", False),
                result_text=data.get("suggested_response", "") if not data.get("is_safe") else "Safe",
                structured_data=data,
                score=1.0 if data.get("is_safe") else 0.0
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
            # Fail closed
            return AgentResponse(
                agent_name=self.name,
                ok=False,
                result_text="Safety check failed. Cannot proceed."
            )
