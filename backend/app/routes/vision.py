"""Vision analysis endpoint for medical image analysis using Gemini Vision"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from typing import Optional
from app.services.gemini_service import GeminiService
from app.services.rag_service import RAGService
from app.services.conversation_service import ConversationService
from app.dependencies import get_current_user
from app.utils.logger import setup_logger
import base64

logger = setup_logger()
router = APIRouter()

# Allowed image types
ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/heic",
    "image/webp"
]

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/vision/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    message: Optional[str] = Form(None),
    conversation_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze medical image using Gemini Vision + RAG
    
    Process:
    1. Validate image file
    2. Analyze with Gemini Vision
    3. Search RAG for relevant context
    4. Combine vision + RAG insights
    5. Return comprehensive response
    
    Args:
        file: Image file upload
        message: Optional user message/question
        current_user: Authenticated user
        
    Returns:
        Vision analysis with RAG context
    """
    try:
        # 1. Validate file type
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
            )
        
        # 2. Read and validate file size
        image_bytes = await file.read()
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        logger.info(f"📸 Analyzing image: {file.filename} ({len(image_bytes)} bytes)")
        
        # 3. Get or create conversation
        conversation_history = []
        conversation_service = ConversationService()
        
        if conversation_id:
            # Use existing conversation
            logger.info(f"📝 Using existing conversation: {conversation_id}")
            messages = await conversation_service.get_conversation_messages(conversation_id)
            # Convert to dict format for Gemini
            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
            logger.info(f"📚 Retrieved {len(conversation_history)} previous messages")
        else:
            # Create new conversation for this image analysis
            logger.info("✨ Creating new conversation for image analysis")
            user_id = current_user.id
            conversation = await conversation_service.create_conversation(
                user_id=user_id,
                title="Image Analysis"
            )
            conversation_id = conversation.id
            logger.info(f"✅ Created conversation: {conversation_id}")
        
        # 4. Analyze with Gemini Vision
        gemini_service = GeminiService()
        vision_summary = await gemini_service.analyze_image(
            image_bytes=image_bytes,
            mime_type=file.content_type,
            user_message=message,
            conversation_history=conversation_history
        )
        
        logger.info(f"👁️  Vision analysis complete ({len(vision_summary)} chars)")
        
        # 5. Save messages to conversation
        # Save user message
        await conversation_service.save_message(
            conversation_id=conversation_id,
            role="user",
            content=message or "Sent an image"
        )
        # Save assistant response  
        await conversation_service.save_message(
            conversation_id=conversation_id,
            role="assistant",
            content=vision_summary
        )
        logger.info(f"💾 Saved messages to conversation: {conversation_id}")
        
        # 6. Search RAG for relevant medical documentation
        rag_service = RAGService()
        
        # Use vision summary as search query
        search_query = vision_summary[:500]  # First 500 chars
        if message:
            search_query = f"{message} {search_query}"
        
        logger.info(f"🔍 Searching RAG with vision insights...")
        context_docs = await rag_service.search_similar(search_query, top_k=3)
        
        # 5. Combine vision + RAG context
        if context_docs and len(context_docs) > 0:
            logger.info(f"✅ Found {len(context_docs)} relevant documents")
            
            # Build context string
            rag_context = "\n\n".join([
                f"Medical Reference {i+1}:\n{doc['content'][:500]}"
                for i, doc in enumerate(context_docs)
            ])
            
            # Generate final response with both vision and RAG
            final_response = await gemini_service.generate_response(
                user_message=f"Based on this image analysis: {vision_summary}\n\nUser question: {message or 'What should I know about this?'}",
                context=[rag_context]
            )
        else:
            logger.info("ℹ️  No RAG context found, using vision-only response")
            final_response = vision_summary
        
        # 6. Encode image for preview (optional)
        image_preview_base64 = base64.b64encode(image_bytes).decode('utf-8')
        image_preview_url = f"data:{file.content_type};base64,{image_preview_base64}"
        
        return {
            "status": "success",
            "conversation_id": conversation_id,  # NEW - return conversation ID
            "image_preview_url": image_preview_url,
            "vision_summary": vision_summary,
            "rag_context_used": len(context_docs) > 0,
            "final_answer": final_response,
            "sources": [
                {
                    "content": doc["content"][:200],
                    "similarity": doc.get("similarity", 0)
                }
                for doc in context_docs[:3]
            ] if context_docs else []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error analyzing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image analysis error: {str(e)}")
