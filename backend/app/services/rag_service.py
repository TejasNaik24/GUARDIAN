"""RAG (Retrieval Augmented Generation) service with embeddings"""
from typing import List, Dict, Any
import google.generativeai as genai
from app.database.vectorstore import VectorStore
from app.config import get_settings
from app.utils.logger import setup_logger
import hashlib

logger = setup_logger()


class RAGService:
    """Service for RAG operations: embedding, indexing, and retrieval"""
    
    def __init__(self):
        """Initialize RAG service with Gemini embedding model and vector store"""
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.vector_store = VectorStore()
        logger.info("✅ RAG service initialized with Gemini text-embedding-004")
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding vector for text using Gemini
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing embedding vector (768 dimensions)
        """
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"❌ Error embedding text with Gemini: {str(e)}")
            raise
    
    async def search_similar(
        self,
        query: str,
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using semantic search with Gemini embeddings
        
        Args:
            query: Search query text
            top_k: Number of results to return
            similarity_threshold: Minimum similarity score
            
        Returns:
            List of similar documents with content and metadata
        """
        try:
            # Generate query embedding using Gemini
            logger.info(f"🔍 Searching for: {query[:50]}...")
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=query,
                task_type="retrieval_query"
            )
            query_embedding = result['embedding']
            
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
        documents: List[Dict[str, Any]],
        chunk_size: int = 500,
        overlap: int = 50
    ) -> List[str]:
        """
        Ingest multiple documents into vector store with chunking
        
        Args:
            documents: List of documents with 'content' and 'metadata'
            chunk_size: Target chunk size in characters
            overlap: Number of overlapping characters between chunks
            
        Returns:
            List of chunk IDs
        """
        try:
            from app.utils.text_cleaner import clean_text, chunk_text
            
            chunk_ids = []
            
            for doc in documents:
                content = doc.get("content", "")
                metadata = doc.get("metadata", {})
                
                if not content.strip():
                    continue
                
                # Clean text
                cleaned_content = clean_text(content)
                
                # Split into chunks with overlap
                chunks = chunk_text(cleaned_content, chunk_size=chunk_size, overlap=overlap)
                
                # Process each chunk
                for chunk_idx, chunk in enumerate(chunks):
                    # Generate unique chunk ID
                    chunk_hash = hashlib.md5(f"{content[:100]}_{chunk_idx}".encode()).hexdigest()
                    
                    # Generate embedding using Gemini
                    embedding = self.embed_text(chunk)
                    
                    # Add chunk metadata
                    chunk_metadata = metadata.copy()
                    chunk_metadata["chunk_index"] = chunk_idx
                    chunk_metadata["total_chunks"] = len(chunks)
                    
                    # Store in vector database
                    await self.vector_store.upsert_embedding(
                        doc_id=chunk_hash,
                        embedding=embedding,
                        content=chunk,
                        metadata=chunk_metadata
                    )
                    
                    chunk_ids.append(chunk_hash)
            
            logger.info(f"✅ Ingested {len(chunk_ids)} chunks from {len(documents)} documents")
            return chunk_ids
            
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
