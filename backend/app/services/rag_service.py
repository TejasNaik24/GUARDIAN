"""RAG (Retrieval Augmented Generation) service with embeddings"""
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from app.database.vectorstore import VectorStore
from app.config import get_settings
from app.utils.logger import setup_logger
import hashlib

logger = setup_logger()


class RAGService:
    """Service for RAG operations: embedding, indexing, and retrieval"""
    
    def __init__(self):
        """Initialize RAG service with embedding model and vector store"""
        settings = get_settings()
        self.embedding_model = SentenceTransformer(settings.embedding_model_name)
        self.vector_store = VectorStore()
        logger.info(f"✅ RAG service initialized with model: {settings.embedding_model_name}")
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding vector for text
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing embedding vector
        """
        try:
            embedding = self.embedding_model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"❌ Error embedding text: {str(e)}")
            raise
    
    async def search_similar(
        self,
        query: str,
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using semantic search
        
        Args:
            query: Search query text
            top_k: Number of results to return
            similarity_threshold: Minimum similarity score
            
        Returns:
            List of similar documents with content and metadata
        """
        try:
            # Generate query embedding
            logger.info(f"🔍 Searching for: {query[:50]}...")
            query_embedding = self.embed_text(query)
            
            # Search vector store
            results = await self.vector_store.query_embedding(
                query_embedding=query_embedding,
                top_k=top_k,
                similarity_threshold=similarity_threshold
            )
            
            logger.info(f"✅ Found {len(results)} similar documents")
            return results
            
        except Exception as e:
            logger.error(f"❌ Error searching similar documents: {str(e)}")
            return []
    
    async def ingest_documents(
        self,
        documents: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Ingest multiple documents into vector store
        
        Args:
            documents: List of documents with 'content' and 'metadata'
            
        Returns:
            List of document IDs
        """
        try:
            doc_ids = []
            
            for doc in documents:
                content = doc.get("content", "")
                metadata = doc.get("metadata", {})
                
                if not content.strip():
                    continue
                
                # Generate document ID from content hash
                doc_id = hashlib.md5(content.encode()).hexdigest()
                
                # Generate embedding
                embedding = self.embed_text(content)
                
                # Store in vector database
                await self.vector_store.upsert_embedding(
                    doc_id=doc_id,
                    embedding=embedding,
                    content=content,
                    metadata=metadata
                )
                
                doc_ids.append(doc_id)
            
            logger.info(f"✅ Ingested {len(doc_ids)} documents")
            return doc_ids
            
        except Exception as e:
            logger.error(f"❌ Error ingesting documents: {str(e)}")
            raise
    
    async def build_context(
        self,
        query: str,
        max_context_length: int = 2000
    ) -> List[str]:
        """
        Build context for LLM from similar documents
        
        Args:
            query: User query
            max_context_length: Maximum total characters for context
            
        Returns:
            List of context strings
        """
        try:
            results = await self.search_similar(query, top_k=5)
            
            contexts = []
            total_length = 0
            
            for doc in results:
                content = doc.get("content", "")
                if total_length + len(content) <= max_context_length:
                    contexts.append(content)
                    total_length += len(content)
                else:
                    break
            
            logger.info(f"✅ Built context with {len(contexts)} documents ({total_length} chars)")
            return contexts
            
        except Exception as e:
            logger.error(f"❌ Error building context: {str(e)}")
            return []
