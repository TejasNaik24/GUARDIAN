"""
RAG Lookup Agent (Retrieval-Augmented Generation)
=================================================

The `RAGLookupAgent` is the researcher of the team. When a query requires specific, verified medical facts
(e.g., "What is the dosage for Ibuprofen?"), this agent consults the knowledge base.

**Workflow:**
1.  **Embed Query:** Converts the user's question into a vector embedding.
2.  **Vector Search:** Queries Supabase `pgvector` to find the most relevant document chunks.
3.  **Synthesize:** Uses the retrieved context to answer the question accurately.

This grounding mechanism significantly reduces hallucinations and ensures advice is based on authoritative sources.

Author: Tejas Naik
"""

from typing import List, Dict, Any
from app.agents.agent_base import AgentBase, AgentRequest, AgentResponse
from app.services.rag_service import RAGService
from app.logging.agent_logger import agent_logger
import time

class RAGLookupAgent(AgentBase):
    """
    Agent responsible for retrieving relevant medical context from the vector store.
    """
    
    def __init__(self):
        super().__init__(name="rag_lookup_agent")
        self.rag_service = RAGService()

    async def handle(self, request: AgentRequest) -> AgentResponse:
        start_time = time.time()
        try:
            # Extract query
            query = request.message
            
            # Perform search
            # We use a slightly lower threshold to ensure we get some context if possible
            results = await self.rag_service.search_similar(query, top_k=5, similarity_threshold=0.6)
            
            # Format chunks
            chunks = []
            citations = []
            
            for doc in results:
                content = doc.get("content", "")
                metadata = doc.get("metadata", {})
                score = doc.get("score", 0.0)
                
                chunks.append(content)
                
                # Create citation object
                citations.append({
                    "source": metadata.get("source", "Unknown"),
                    "page": metadata.get("page", 0),
                    "snippet": content[:200] + "...",
                    "score": score
                })

            # Calculate execution time
            duration = (time.time() - start_time) * 1000
            
            # Log execution
            agent_logger.log_agent_execution(
                self.name, 
                request.metadata.get("request_id", "unknown") if request.metadata else "unknown",
                duration,
                True,
                {"chunks_found": len(chunks)}
            )

            return AgentResponse(
                agent_name=self.name,
                ok=True,
                result_text=f"Found {len(chunks)} relevant documents.",
                structured_data={"chunks": chunks},
                citations=citations,
                score=1.0 if chunks else 0.0
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
                result_text=f"Error retrieving documents: {str(e)}"
            )
