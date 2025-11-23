"""Script to ingest PDF documents into RAG system"""
import asyncio
import sys
from pathlib import Path
from pypdf import PdfReader
from app.services.rag_service import RAGService
from app.utils.text_cleaner import chunk_text, clean_text
from app.utils.logger import setup_logger

logger = setup_logger()


async def ingest_pdf_file(pdf_path: str, source_name: str = None):
    """
    Ingest a PDF file into the RAG system
    
    Args:
        pdf_path: Path to PDF file
        source_name: Optional source identifier
    """
    try:
        # Read PDF
        logger.info(f"📄 Reading PDF: {pdf_path}")
        reader = PdfReader(pdf_path)
        
        if not source_name:
            source_name = Path(pdf_path).stem
        
        # Extract and process text
        documents = []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if not text.strip():
                continue
            
            # Clean and chunk text
            cleaned_text = clean_text(text)
            chunks = chunk_text(cleaned_text, chunk_size=500, overlap=50)
            
            for chunk_idx, chunk in enumerate(chunks):
                documents.append({
                    "content": chunk,
                    "metadata": {
                        "source": source_name,
                        "page": page_num + 1,
                        "chunk": chunk_idx + 1
                    }
                })
        
        logger.info(f"📊 Extracted {len(documents)} chunks from {len(reader.pages)} pages")
        
        # Ingest into RAG
        rag_service = RAGService()
        doc_ids = await rag_service.ingest_documents(documents)
        
        logger.info(f"✅ Successfully ingested {len(doc_ids)} document chunks")
        return doc_ids
        
    except Exception as e:
        logger.error(f"❌ Error ingesting PDF: {str(e)}")
        raise


async def ingest_directory(directory_path: str):
    """
    Ingest all PDF files from a directory
    
    Args:
        directory_path: Path to directory containing PDFs
    """
    directory = Path(directory_path)
    pdf_files = list(directory.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning(f"⚠️  No PDF files found in {directory_path}")
        return
    
    logger.info(f"📚 Found {len(pdf_files)} PDF files")
    
    for pdf_file in pdf_files:
        try:
            await ingest_pdf_file(str(pdf_file))
        except Exception as e:
            logger.error(f"❌ Failed to ingest {pdf_file.name}: {str(e)}")
            continue


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ingest_pdf.py <pdf_file_or_directory>")
        sys.exit(1)
    
    path = sys.argv[1]
    
    if Path(path).is_file():
        asyncio.run(ingest_pdf_file(path))
    elif Path(path).is_dir():
        asyncio.run(ingest_directory(path))
    else:
        print(f"Error: {path} is not a valid file or directory")
        sys.exit(1)
