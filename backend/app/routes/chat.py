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
        
        # 3. Get conversation history
        logger.info(f"📝 Retrieving conversation history for: {conversation.id}")
        messages = await conversation_service.get_conversation_messages(conversation.id)
        # Convert to dict format for Gemini (exclude the just-saved user message)
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in messages[:-1]  # Exclude last message (current user message)
        ]
        logger.info(f"📚 Retrieved {len(conversation_history)} previous messages")
        
        # 4. Retrieve RAG context
        logger.info(f"🔍 Retrieving context for: {request.message[:50]}...")
        context_docs = await rag_service.search_similar(request.message)
        context_texts = [doc["content"] for doc in context_docs]
        
        # 5. Generate response with Gemini
        logger.info("🤖 Generating response with Gemini...")
        response_text = await gemini_service.generate_response(
            user_message=request.message,
            context=context_texts,
            conversation_history=conversation_history
        )
        
        # 6. Save assistant message
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


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Stream chat response with RAG enhancement
    
    Returns:
        Server-Sent Events (SSE) stream
    """
    from fastapi.responses import StreamingResponse
    import json
    import asyncio

    async def event_generator():
        try:
            user_id = current_user.id
            conversation_service = ConversationService()
            rag_service = RAGService()
            gemini_service = GeminiService()
            
            # 1. Get or create conversation
            if request.conversation_id:
                conversation = await conversation_service.get_conversation(request.conversation_id)
                if not conversation or conversation.user_id != user_id:
                    yield f"data: {json.dumps({'error': 'Conversation not found'})}\n\n"
                    return
            else:
                conversation = await conversation_service.create_conversation(
                    user_id=user_id,
                    title="New Chat"
                )
            
            # Send conversation ID immediately
            yield f"data: {json.dumps({'conversation_id': conversation.id})}\n\n"
            
            # 2. Save user message
            await conversation_service.save_message(
                conversation_id=conversation.id,
                role="user",
                content=request.message
            )
            
            # 3. Get conversation history
            logger.info(f"📝 Retrieving conversation history for: {conversation.id}")
            messages = await conversation_service.get_conversation_messages(conversation.id)
            # Convert to dict format for Gemini (exclude the just-saved user message)
            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in messages[:-1]  # Exclude last message (current user message)
            ]
            logger.info(f"📚 Retrieved {len(conversation_history)} previous messages")
            
            # 4. Retrieve RAG context
            logger.info(f"🔍 Retrieving context for: {request.message[:50]}...")
            context_docs = await rag_service.search_similar(request.message)
            context_texts = [doc["content"] for doc in context_docs]
            
            # Send status update
            logger.info("📊 Sending status event: generating")
            yield f"data: {json.dumps({'status': 'generating'})}\n\n"
            
            # 5. Generate streaming response
            logger.info("🤖 Generating streaming response...")
            full_response = ""
            
            async for chunk in gemini_service.generate_response_stream(
                user_message=request.message,
                context=context_texts,
                conversation_history=conversation_history
            ):
                full_response += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                # Small delay to ensure chunks are sent distinctly if needed, 
                # but usually not necessary with async generators
                # await asyncio.sleep(0.01)
            
            # 5. Save assistant message
            await conversation_service.save_message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response
            )
            
            # 6. Auto-generate title if first message
            if not request.conversation_id:
                title = await conversation_service.generate_title(request.message)
                await conversation_service.update_conversation_title(conversation.id, title)
            
            # 7. Send sources and completion
            sources = [{"content": doc["content"][:200], "similarity": doc.get("similarity", 0)} 
                      for doc in context_docs[:3]]
            
            yield f"data: {json.dumps({'sources': sources})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            
            logger.info(f"✅ Stream completed for conversation: {conversation.id}")
            
        except Exception as e:
            logger.error(f"❌ Error in stream endpoint: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


@router.delete("/chat/conversations/all")
async def delete_all_conversations(
    current_user: dict = Depends(get_current_user)
):
    """
    Delete all conversations for the current user
    
    Args:
        current_user: Authenticated user from JWT
        
    Returns:
        Success message
    """
    try:
        user_id = current_user.id
        conversation_service = ConversationService()
        
        # Delete all conversations for this user
        # Messages will be cascade deleted due to foreign key constraint
        conversation_service.supabase.table("conversations").delete().eq("user_id", user_id).execute()
        
        logger.info(f"✅ Deleted all conversations for user: {user_id}")
        return {"status": "success", "message": "All conversations deleted"}
        
    except Exception as e:
        logger.error(f"❌ Error deleting all conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GUEST MODE ENDPOINTS (No Authentication Required)
# ============================================================================

@router.post("/chat/guest", response_model=ChatResponse)
async def chat_guest(request: ChatRequest):
    """
    Process chat message for guest users (no authentication required)
    
    Note: Guest conversations are not saved to database
    
    Args:
        request: Chat request with message
        
    Returns:
        Chat response with assistant message and sources
    """
    try:
        rag_service = RAGService()
        gemini_service = GeminiService()
        
        # 1. Retrieve RAG context
        logger.info(f"🔍 [Guest] Retrieving context for: {request.message[:50]}...")
        context_docs = await rag_service.search_similar(request.message)
        context_texts = [doc["content"] for doc in context_docs]
        
        # 2. Generate response with Gemini (no conversation history for guests)
        logger.info("🤖 [Guest] Generating response with Gemini...")
        response_text = await gemini_service.generate_response(
            user_message=request.message,
            context=context_texts,
            conversation_history=None
        )
        
        logger.info("✅ [Guest] Chat response generated")
        
        return ChatResponse(
            conversation_id="guest",  # Special ID for guest mode
            message=response_text,
            role="assistant",
            sources=[{"content": doc["content"][:200], "similarity": doc.get("similarity", 0)} 
                    for doc in context_docs[:3]]
        )
        
    except Exception as e:
        logger.error(f"❌ Error in guest chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/chat/guest/stream")
async def chat_guest_stream(request: ChatRequest):
    """
    Stream chat response for guest users (no authentication required)
    
    Note: Guest conversations are not saved to database
    
    Returns:
        Server-Sent Events (SSE) stream
    """
    from fastapi.responses import StreamingResponse
    import json

    async def event_generator():
        try:
            rag_service = RAGService()
            gemini_service = GeminiService()
            
            # Send guest conversation ID immediately
            yield f"data: {json.dumps({'conversation_id': 'guest'})}\n\n"
            
            # 1. Retrieve RAG context
            logger.info(f"🔍 [Guest] Retrieving context for: {request.message[:50]}...")
            context_docs = await rag_service.search_similar(request.message)
            context_texts = [doc["content"] for doc in context_docs]
            
            # Send status update
            logger.info("📊 [Guest] Sending status event: generating")
            yield f"data: {json.dumps({'status': 'generating'})}\n\n"
            
            # 2. Generate streaming response (no conversation history for guests)
            logger.info("🤖 [Guest] Generating streaming response...")
            full_response = ""
            
            async for chunk in gemini_service.generate_response_stream(
                user_message=request.message,
                context=context_texts,
                conversation_history=None
            ):
                full_response += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            # 3. Send sources and completion
            sources = [{"content": doc["content"][:200], "similarity": doc.get("similarity", 0)} 
                      for doc in context_docs[:3]]
            
            yield f"data: {json.dumps({'sources': sources})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            
            logger.info("✅ [Guest] Stream completed")
            
        except Exception as e:
            logger.error(f"❌ Error in guest stream endpoint: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
