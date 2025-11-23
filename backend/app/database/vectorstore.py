"""Vector store operations using Supabase pgvector"""
from typing import List, Dict, Any, Optional
from supabase import Client
from app.database.supabase_client import get_supabase_client
from app.utils.logger import setup_logger

logger = setup_logger()


class VectorStore:
    """Supabase pgvector wrapper for embedding operations"""
    
    def __init__(self, client: Optional[Client] = None):
        """
        Initialize vector store
        
        Args:
            client: Optional Supabase client, creates new one if not provided
        """
        self.client = client or get_supabase_client()
        self.table_name = "documents"
    
    async def upsert_embedding(
        self,
        doc_id: str,
        embedding: List[float],
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Insert or update document embedding in vector store
        
        Args:
            doc_id: Unique document identifier
            embedding: Vector embedding (list of floats)
            content: Original text content
            metadata: Additional metadata (source, page, etc.)
            
        Returns:
            Upserted document data
        """
        try:
            data = {
                "id": doc_id,
                "embedding": embedding,
                "content": content,
                "metadata": metadata or {}
            }
            
            result = self.client.table(self.table_name).upsert(data).execute()
            logger.info(f"✅ Upserted document: {doc_id}")
            return result.data[0] if result.data else {}
            
        except Exception as e:
            logger.error(f"❌ Error upserting embedding: {str(e)}")
            raise
    
    async def query_embedding(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using vector similarity
        
        Args:
            query_embedding: Query vector embedding
            top_k: Number of results to return
            similarity_threshold: Minimum similarity score
            
        Returns:
            List of similar documents with similarity scores
        """
        try:
            # Call Supabase RPC function for vector similarity search
            result = self.client.rpc(
                "match_documents",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": similarity_threshold,
                    "match_count": top_k
                }
            ).execute()
            
            logger.info(f"🔍 Found {len(result.data)} similar documents")
            return result.data
            
        except Exception as e:
            logger.error(f"❌ Error querying embeddings: {str(e)}")
            raise
    
    async def delete_document(self, doc_id: str) -> bool:
        """
        Delete document from vector store
        
        Args:
            doc_id: Document identifier to delete
            
        Returns:
            True if deletion successful
        """
        try:
            self.client.table(self.table_name).delete().eq("id", doc_id).execute()
            logger.info(f"🗑️  Deleted document: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error deleting document: {str(e)}")
            return False
