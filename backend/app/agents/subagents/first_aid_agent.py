from typing import List, Dict, Any
import json
from app.agents.agent_base import AgentBase, AgentRequest, AgentResponse
from app.services.llm_client import llm_client
from app.logging.agent_logger import agent_logger
import time

class FirstAidAgent(AgentBase):
    """
    Agent responsible for providing first aid instructions.
    """
    
    def __init__(self):
        super().__init__(name="first_aid_agent")

    async def handle(self, request: AgentRequest) -> AgentResponse:
        start_time = time.time()
        try:
            # Use RAG context if available in request.context
            rag_context = ""
            if request.context and "rag_chunks" in request.context:
                rag_context = "\n".join(request.context["rag_chunks"])
            
            prompt = f"""
            Provide step-by-step first aid instructions for: "{request.message}"
            
            Use this authoritative context if relevant:
            {rag_context}
            
            Rules:
            1. Be concise and clear.
            2. Number the steps.
            3. Do NOT diagnose.
            4. If emergency, start with "Call Emergency Services".
            
            Output JSON ONLY:
            {{
                "title": "First Aid for ...",
                "steps": ["1. ...", "2. ..."],
                "warnings": ["warning 1", "warning 2"]
            }}
            """
            
            response_text = await llm_client.generate_text(prompt, temperature=0.2)
            
            try:
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
            except json.JSONDecodeError:
                # Fallback to raw text if JSON fails
                data = {
                    "title": "First Aid Instructions",
                    "steps": [line for line in response_text.split('\n') if line.strip()],
                    "warnings": []
                }

            duration = (time.time() - start_time) * 1000
            agent_logger.log_agent_execution(
                self.name,
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                duration,
                True,
                {"steps_count": len(data.get("steps", []))}
            )

            return AgentResponse(
                agent_name=self.name,
                ok=True,
                result_text=f"First Aid: {data.get('title')}",
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
                result_text=f"Error generating first aid: {str(e)}"
            )
