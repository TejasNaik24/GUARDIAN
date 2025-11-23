"""Tests for RAG service"""
import pytest
from app.services.rag_service import RAGService


@pytest.mark.asyncio
async def test_embed_text():
    """Test text embedding generation"""
    rag_service = RAGService()
    embedding = rag_service.embed_text("This is a test sentence")
    
    assert isinstance(embedding, list)
    assert len(embedding) == 384  # Dimension for all-MiniLM-L6-v2
    assert all(isinstance(x, float) for x in embedding)


@pytest.mark.asyncio
async def test_ingest_documents():
    """Test document ingestion"""
    rag_service = RAGService()
    
    documents = [
        {
            "content": "Diabetes is a chronic disease that affects how your body processes blood sugar.",
            "metadata": {"source": "test", "page": 1}
        },
        {
            "content": "Type 2 diabetes is the most common form of diabetes.",
            "metadata": {"source": "test", "page": 2}
        }
    ]
    
    doc_ids = await rag_service.ingest_documents(documents)
    
    assert len(doc_ids) == 2
    assert all(isinstance(doc_id, str) for doc_id in doc_ids)


@pytest.mark.asyncio
async def test_search_similar():
    """Test similarity search"""
    rag_service = RAGService()
    
    # First ingest some test documents
    documents = [
        {
            "content": "The pancreas produces insulin to regulate blood sugar levels.",
            "metadata": {"source": "test"}
        }
    ]
    await rag_service.ingest_documents(documents)
    
    # Search for similar content
    results = await rag_service.search_similar("What does the pancreas do?", top_k=1)
    
    assert isinstance(results, list)
    if len(results) > 0:
        assert "content" in results[0]
        assert "similarity" in results[0]
