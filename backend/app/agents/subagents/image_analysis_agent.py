from typing import List, Dict, Any
import base64
import json
from app.agents.agent_base import AgentBase, AgentRequest, AgentResponse
from app.services.llm_client import llm_client
from app.logging.agent_logger import agent_logger
import time

class ImageAnalysisAgent(AgentBase):
    """
    Agent responsible for analyzing medical images.
    """
    
    def __init__(self):
        super().__init__(name="image_analysis_agent")

    async def handle(self, request: AgentRequest) -> AgentResponse:
        start_time = time.time()
        
        if not request.image_base64:
            return AgentResponse(
                agent_name=self.name,
                ok=False,
                result_text="No image provided."
            )

        try:
            # Decode image
            image_bytes = base64.b64decode(request.image_base64)
            
            # Prompt for structured analysis
            prompt = """
            Analyze this medical image. 
            Identify if it shows a:
            1. Medication (pills, bottle, blister pack)
            2. Wound / Injury / Rash
            3. Medical Device
            4. Non-medical object (if so, reject)

            Output JSON ONLY:
            {
                "type": "medication|wound|device|other",
                "is_medical": true/false,
                "description": "detailed description",
                "severity_hint": "low|medium|high|unknown",
                "detected_text": "any text on labels",
                "recommended_next_steps": ["step 1", "step 2"]
            }
            """
            
            response_text = await llm_client.analyze_image(image_bytes, prompt)
            
            # Parse JSON
            try:
                # Clean markdown code blocks if present
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
            except json.JSONDecodeError:
                # Fallback if LLM didn't return valid JSON
                data = {
                    "type": "unknown",
                    "is_medical": True, # Assume true to be safe, let safety agent catch it
                    "description": response_text,
                    "severity_hint": "unknown",
                    "recommended_next_steps": []
                }

            duration = (time.time() - start_time) * 1000
            agent_logger.log_agent_execution(
                self.name,
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                duration,
                True,
                {"type": data.get("type")}
            )

            return AgentResponse(
                agent_name=self.name,
                ok=True,
                result_text=data.get("description", ""),
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
                result_text=f"Error analyzing image: {str(e)}"
            )
