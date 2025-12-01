from typing import List, Dict, Any
import json
from app.agents.agent_base import AgentBase, AgentRequest, AgentResponse
from app.services.llm_client import llm_client
from app.logging.agent_logger import agent_logger
import time

class SymptomsAgent(AgentBase):
    """
    Agent responsible for extracting structured symptoms and assessing urgency.
    """
    
    def __init__(self):
        super().__init__(name="symptoms_agent")

    async def handle(self, request: AgentRequest) -> AgentResponse:
        start_time = time.time()
        try:
            # Prompt for extraction
            prompt = f"""
            Extract symptoms from the user message.
            User Message: "{request.message}"
            
            Output JSON ONLY:
            {{
                "symptoms": ["list", "of", "symptoms"],
                "duration": "duration string or null",
                "severity_indicators": ["severe pain", "high fever", etc],
                "red_flags": true/false (if any emergency keywords present like chest pain, difficulty breathing),
                "urgency_score": 0.0 to 1.0 (1.0 is immediate emergency)
            }}
            """
            
            response_text = await llm_client.generate_text(prompt, temperature=0.0)
            
            # Parse JSON
            try:
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
            except json.JSONDecodeError:
                data = {
                    "symptoms": [],
                    "duration": None,
                    "severity_indicators": [],
                    "red_flags": False,
                    "urgency_score": 0.0
                }

            duration = (time.time() - start_time) * 1000
            agent_logger.log_agent_execution(
                self.name,
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                duration,
                True,
                {"urgency": data.get("urgency_score")}
            )

            return AgentResponse(
                agent_name=self.name,
                ok=True,
                result_text=f"Identified symptoms: {', '.join(data.get('symptoms', []))}",
                structured_data=data,
                score=data.get("urgency_score", 0.0)
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
                result_text=f"Error analyzing symptoms: {str(e)}"
            )
