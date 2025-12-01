from typing import List, Dict, Any
import asyncio
import uuid
import time
import json

from app.agents.agent_base import AgentRequest, AgentResponse
from app.agents.router import router
from app.services.llm_client import llm_client
from app.logging.agent_logger import agent_logger

# Import subagents
from app.agents.subagents.safety_agent import SafetyAgent
from app.agents.subagents.rag_lookup_agent import RAGLookupAgent
from app.agents.subagents.image_analysis_agent import ImageAnalysisAgent
from app.agents.subagents.symptoms_agent import SymptomsAgent
from app.agents.subagents.triage_agent import TriageAgent
from app.agents.subagents.first_aid_agent import FirstAidAgent
from app.agents.subagents.pediatric_agent import PediatricAgent

class MainAgent:
    """
    Orchestrator agent that manages the lifecycle of a request.
    """
    
    def __init__(self):
        self.agents = {
            "safety_agent": SafetyAgent(),
            "rag_lookup_agent": RAGLookupAgent(),
            "image_analysis_agent": ImageAnalysisAgent(),
            "symptoms_agent": SymptomsAgent(),
            "triage_agent": TriageAgent(),
            "first_aid_agent": FirstAidAgent(),
            "pediatric_agent": PediatricAgent()
        }

    async def handle(self, request: AgentRequest) -> Dict[str, Any]:
        """
        Main entry point for processing a request.
        """
        request_id = str(uuid.uuid4())
        if not request.metadata:
            request.metadata = {}
        request.metadata["request_id"] = request_id
        
        start_time = time.time()
        agent_trace = []
        
        # 1. Route
        selected_agent_names = await router.route(request)
        
        # 2. Execute Safety First
        if "safety_agent" in selected_agent_names:
            safety_response = await self.agents["safety_agent"].handle(request)
            agent_trace.append({
                "agent": "safety_agent",
                "ok": safety_response.ok,
                "result": safety_response.result_text
            })
            
            if not safety_response.ok:
                # Unsafe! Return immediately
                return {
                    "final_text": safety_response.result_text or "I cannot process this request due to safety guidelines.",
                    "agent_trace": agent_trace,
                    "citations": [],
                    "urgency_level": "RED" # Treat unsafe as high alert internally
                }
            
            # Remove safety from list to run others
            selected_agent_names = [n for n in selected_agent_names if n != "safety_agent"]

        # 3. Execute other agents concurrently
        # We might need to sequence them if dependencies exist, but for MVP we run parallel
        # and then synthesize. 
        # Exception: Triage might need Symptoms output. 
        # For this MVP, we'll run them in parallel and let the final synthesis handle discrepancies,
        # OR we can do a simple 2-stage: [Image, RAG, Symptoms] -> [Triage, FirstAid, Pediatric]
        
        # Let's do parallel for now for speed, as agents are mostly independent or self-contained in this design.
        # Ideally, SymptomsAgent output should feed TriageAgent.
        # Let's try to run Symptoms/Image/RAG first, then Triage/FirstAid.
        
        stage1_agents = []
        stage2_agents = []
        
        for name in selected_agent_names:
            if name in ["image_analysis_agent", "symptoms_agent", "rag_lookup_agent"]:
                stage1_agents.append(name)
            else:
                stage2_agents.append(name)
                
        # Run Stage 1
        stage1_tasks = [self.agents[name].handle(request) for name in stage1_agents if name in self.agents]
        stage1_results = await asyncio.gather(*stage1_tasks, return_exceptions=True)
        
        # Collect results and update context for Stage 2
        context_update = {}
        rag_chunks = []
        
        for i, res in enumerate(stage1_results):
            agent_name = stage1_agents[i]
            if isinstance(res, AgentResponse):
                agent_trace.append({
                    "agent": agent_name,
                    "ok": res.ok,
                    "result": res.result_text,
                    "data": res.structured_data
                })
                if res.structured_data:
                    context_update[agent_name] = res.structured_data
                if agent_name == "rag_lookup_agent" and res.structured_data:
                    rag_chunks.extend(res.structured_data.get("chunks", []))
            else:
                agent_logger.log_agent_execution(agent_name, request_id, 0, False, {"error": str(res)})

        # Update request context with Stage 1 data
        if not request.context:
            request.context = {}
        request.context.update(context_update)
        if rag_chunks:
            request.context["rag_chunks"] = rag_chunks

        # Run Stage 2
        stage2_tasks = [self.agents[name].handle(request) for name in stage2_agents if name in self.agents]
        stage2_results = await asyncio.gather(*stage2_tasks, return_exceptions=True)
        
        for i, res in enumerate(stage2_results):
            agent_name = stage2_agents[i]
            if isinstance(res, AgentResponse):
                agent_trace.append({
                    "agent": agent_name,
                    "ok": res.ok,
                    "result": res.result_text,
                    "data": res.structured_data
                })
            else:
                agent_logger.log_agent_execution(agent_name, request_id, 0, False, {"error": str(res)})

        # 4. Synthesize Final Response
        final_response = await self._synthesize_response(request, agent_trace)
        
        duration = (time.time() - start_time) * 1000
        agent_logger.log_agent_execution("main_agent", request_id, duration, True, {"agents_count": len(agent_trace)})
        
        return final_response

    async def _synthesize_response(self, request: AgentRequest, trace: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Combine all agent outputs into a final response.
        """
        # Prepare context for synthesis
        synthesis_context = ""
        citations = []
        urgency = "GREEN"
        
        for item in trace:
            name = item["agent"]
            result = item.get("result", "")
            data = item.get("data", {})
            
            synthesis_context += f"\n--- {name.upper()} OUTPUT ---\n{result}\n"
            
            if name == "rag_lookup_agent":
                # Collect citations (not implemented in trace yet, need to grab from response object if we had it)
                # For now, we rely on the text result or data
                pass
                
            if name == "triage_agent" and data:
                level = data.get("level", "GREEN")
                if level == "RED": urgency = "RED"
                elif level == "YELLOW" and urgency != "RED": urgency = "YELLOW"

        # Final Prompt
        prompt = f"""
        You are Guardian AI, a medical assistant.
        Synthesize a final response for the user based on the expert agent outputs below.
        
        User Message: "{request.message}"
        
        Expert Outputs:
        {synthesis_context}
        
        Instructions:
        1. Combine the advice into a coherent, empathetic response.
        2. If Triage is RED, start with "EMERGENCY: Please call emergency services immediately."
        3. Use the First Aid steps if provided.
        4. Use the RAG context to support your answer.
        5. Do NOT mention "Agent" names to the user. Just speak naturally.
        6. Be concise.
        
        Response:
        """
        
        final_text = await llm_client.generate_text(prompt, temperature=0.7)
        
        return {
            "final_text": final_text,
            "agent_trace": trace,
            "citations": citations, # TODO: Propagate citations properly
            "urgency_level": urgency
        }

main_agent = MainAgent()
