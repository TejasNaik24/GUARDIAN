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
    files: list[UploadFile] = File(...),
    message: Optional[str] = Form(None),
    conversation_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze medical images using Gemini Vision + RAG
    
    Process:
    1. Validate image files
    2. Analyze with Gemini Vision (batch)
    3. Search RAG for relevant context
    4. Combine vision + RAG insights
    5. Return comprehensive response
    
    Args:
        files: List of image file uploads
        message: Optional user message/question
        current_user: Authenticated user
        
    Returns:
        Vision analysis with RAG context
    """
    try:
        # 1. Validate file types and sizes
        valid_images = []
        total_size = 0
        
        for file in files:
            if file.content_type not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type for {file.filename}. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
                )
            
            content = await file.read()
            size = len(content)
            total_size += size
            
            if size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
                )
                
            valid_images.append({
                "content": content,
                "mime_type": file.content_type,
                "filename": file.filename
            })
            
        logger.info(f"📸 Analyzing {len(valid_images)} images (Total: {total_size} bytes)")
        
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
            images=valid_images,
            user_message=message,
            conversation_history=conversation_history
        )
        
        logger.info(f"👁️  Vision analysis complete ({len(vision_summary)} chars)")
        
        # 5. Save messages to conversation
        # Save user message
        await conversation_service.save_message(
            conversation_id=conversation_id,
            role="user",
            content=message or f"Sent {len(valid_images)} images"
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
        
        # 6. Encode images for preview
        image_preview_urls = []
        for img in valid_images:
            image_preview_base64 = base64.b64encode(img["content"]).decode('utf-8')
            image_preview_urls.append(f"data:{img['mime_type']};base64,{image_preview_base64}")
        
        return {
            "status": "success",
            "conversation_id": conversation_id,
            "image_preview_urls": image_preview_urls, # LIST of URLs
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
