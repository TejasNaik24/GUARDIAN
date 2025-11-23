"""Document ingestion endpoints for RAG"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
from app.services.rag_service import RAGService
from app.dependencies import get_current_user
from app.utils.logger import setup_logger
from pypdf import PdfReader
import io

logger = setup_logger()
router = APIRouter()


@router.post("/ingest/pdf")
async def ingest_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Ingest PDF document into vector store
    
    Process:
    1. Extract text from PDF
    2. Split into chunks
    3. Generate embeddings
    4. Store in vector database
    
    Args:
        file: PDF file upload
        current_user: Authenticated user
        
    Returns:
        Ingestion status and document ID
    """
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read PDF content
        logger.info(f"📄 Processing PDF: {file.filename}")
        content = await file.read()
        pdf_reader = PdfReader(io.BytesIO(content))
        
        # Extract text from all pages
        text_chunks = []
        for page_num, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if text.strip():
                text_chunks.append({
                    "content": text,
                    "metadata": {
                        "source": file.filename,
                        "page": page_num + 1,
                        "user_id": current_user.id
                    }
                })
        
        if not text_chunks:
            raise HTTPException(status_code=400, detail="No text content found in PDF")
        
        # Ingest into RAG
        rag_service = RAGService()
        doc_ids = await rag_service.ingest_documents(text_chunks)
        
        logger.info(f"✅ Ingested {len(doc_ids)} chunks from {file.filename}")
        
        return {
            "status": "success",
            "filename": file.filename,
            "chunks_ingested": len(doc_ids),
            "document_ids": doc_ids[:5]  # Return first 5 IDs
        }
        
    except Exception as e:
        logger.error(f"❌ Error ingesting PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


@router.post("/ingest/text")
async def ingest_text(
    text: str,
    source: str = "manual_upload",
    current_user: dict = Depends(get_current_user)
):
    """
    Ingest plain text into vector store
    
    Args:
        text: Text content to ingest
        source: Source identifier
        current_user: Authenticated user
        
    Returns:
        Ingestion status and document ID
    """
    try:
        logger.info(f"📝 Ingesting text from: {source}")
        
        rag_service = RAGService()
        doc_ids = await rag_service.ingest_documents([{
            "content": text,
            "metadata": {
                "source": source,
                "user_id": current_user.id
            }
        }])
        
        logger.info(f"✅ Ingested text: {doc_ids[0]}")
        
        return {
            "status": "success",
            "document_id": doc_ids[0],
            "source": source
        }
        
    except Exception as e:
        logger.error(f"❌ Error ingesting text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")
