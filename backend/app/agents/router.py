"""
Guardian Agent Router
=====================

The `AgentRouter` is the central "dispatcher" of the Guardian system. It analyzes every incoming user query
and determines which specialized agent is best suited to handle it.

**How it works:**
1.  **Analysis:** Uses Gemini 1.5 Pro to classify the user's intent (e.g., "Medical Emergency", "General Health Question", "Safety Issue").
2.  **Routing:** Maps the intent to a specific sub-agent (e.g., `TriageAgent`, `FirstAidAgent`, `SafetyAgent`).
3.  **Fallback:** Handles unclear or out-of-scope queries gracefully.

This ensures that a pediatric question goes to the `PediatricAgent` and a wound image goes to the `ImageAnalysisAgent`.

Author: Tejas Naik
"""

from typing import Dict, Any, List, Optional
import json
from app.agents.agent_base import AgentRequest
from app.services.llm_client import llm_client
from app.logging.agent_logger import agent_logger
import time

class AgentRouter:
    """
    Router to select appropriate sub-agents based on the user query.
    """
    
    async def route(self, request: AgentRequest) -> List[str]:
        """
        Determine which agents to call.
        Always returns a list of agent names.
        """
        start_time = time.time()
        
        # Default agents
        selected_agents = ["safety_agent"] # Always run safety first
        
        # If image is present, always add image analysis
        if request.image_base64:
            selected_agents.append("image_analysis_agent")
            
        try:
            # fast classification
            prompt = f"""
            Classify this medical query to select the best experts.
            Query: "{request.message}"
            
            Experts:
            - symptoms_agent: User describes symptoms or feeling unwell.
            - first_aid_agent: User asks how to treat an injury, burn, choking, etc.
            - pediatric_agent: Query involves a child, baby, or toddler.
            - rag_lookup_agent: General medical questions, definitions, or research.
            
            Output JSON ONLY:
            {{
                "experts": ["list", "of", "expert_names"]
            }}
            """
            
            response_text = await llm_client.generate_text(prompt, temperature=0.0)
            
            try:
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
                experts = data.get("experts", [])
                
                # Add selected experts
                for expert in experts:
                    if expert in ["symptoms_agent", "first_aid_agent", "pediatric_agent", "rag_lookup_agent"]:
                        if expert not in selected_agents:
                            selected_agents.append(expert)
                            
                # Logic: If symptoms are present, we likely need triage
                if "symptoms_agent" in selected_agents:
                    if "triage_agent" not in selected_agents:
                        selected_agents.append("triage_agent")
                        
                # Logic: If first aid is needed, we might need RAG for details
                if "first_aid_agent" in selected_agents:
                    if "rag_lookup_agent" not in selected_agents:
                        selected_agents.append("rag_lookup_agent")

            except json.JSONDecodeError:
                # Fallback: Add RAG lookup if classification fails
                if "rag_lookup_agent" not in selected_agents:
                    selected_agents.append("rag_lookup_agent")

            duration = (time.time() - start_time) * 1000
            agent_logger.log_routing_decision(
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                request.message,
                selected_agents,
                {} # Scores not implemented in this simple version
            )
            
            return selected_agents

        except Exception as e:
            # Fallback on error
            print(f"Routing error: {e}")
            return ["safety_agent", "rag_lookup_agent"]

router = AgentRouter()
