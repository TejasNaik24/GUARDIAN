"""Chat endpoints for conversational AI"""
from fastapi import APIRouter, Depends, HTTPException
from app.models.message import ChatRequest, ChatResponse
from app.services.conversation_service import ConversationService
from app.services.rag_service import RAGService
from app.services.gemini_service import GeminiService
from app.dependencies import get_current_user
from app.utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Process chat message with RAG-enhanced response
    
    Flow:
    1. Save user message to database
    2. Retrieve relevant context from RAG
    3. Generate response using Gemini
    4. Save assistant message
    5. Return response
    
    Args:
        request: Chat request with message and optional conversation_id
        current_user: Authenticated user from JWT
        
    Returns:
        Chat response with assistant message and sources
    """
    try:
        user_id = current_user.id
        conversation_service = ConversationService()
        rag_service = RAGService()
        gemini_service = GeminiService()
        
        # 1. Get or create conversation
        if request.conversation_id:
            conversation = await conversation_service.get_conversation(request.conversation_id)
            if not conversation or conversation.user_id != user_id:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            conversation = await conversation_service.create_conversation(
                user_id=user_id,
                title="New Chat"
            )
        
        # 2. Save user message
        await conversation_service.save_message(
            conversation_id=conversation.id,
            role="user",
            content=request.message
        )
        
        # 3. Retrieve RAG context
        logger.info(f"🔍 Retrieving context for: {request.message[:50]}...")
        context_docs = await rag_service.search_similar(request.message)
        context_texts = [doc["content"] for doc in context_docs]
        
        # 4. Generate response with Gemini
        logger.info("🤖 Generating response with Gemini...")
        response_text = await gemini_service.generate_response(
            user_message=request.message,
            context=context_texts
        )
        
        # 5. Save assistant message
        await conversation_service.save_message(
            conversation_id=conversation.id,
            role="assistant",
            content=response_text
        )
        
        # 6. Auto-generate title if first message
        if not request.conversation_id:
            title = await conversation_service.generate_title(request.message)
            await conversation_service.update_conversation_title(conversation.id, title)
        
        logger.info(f"✅ Chat response generated for conversation: {conversation.id}")
        
        return ChatResponse(
            conversation_id=conversation.id,
            message=response_text,
            role="assistant",
            sources=[{"content": doc["content"][:200], "similarity": doc.get("similarity", 0)} 
                    for doc in context_docs[:3]]
        )
        
    except Exception as e:
        logger.error(f"❌ Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
