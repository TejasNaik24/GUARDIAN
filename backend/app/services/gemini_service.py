"""Gemini AI service using Google Generative AI SDK"""
import google.generativeai as genai
from typing import List, Optional
from app.config import get_settings
from app.utils.logger import setup_logger

logger = setup_logger()


class GeminiService:
    """Service for interacting with Google Gemini AI"""
    
    def __init__(self):
        """Initialize Gemini service with API key"""
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        logger.info("✅ Gemini service initialized")
    
    async def generate_response(
        self,
        user_message: str,
        context: Optional[List[str]] = None
    ) -> str:
        """
        Generate response using Gemini with optional RAG context
        
        Args:
            user_message: User's input message
            context: List of relevant context strings from RAG
            
        Returns:
            Generated response text
        """
        try:
            # Build prompt with context
            if context and len(context) > 0:
                context_text = "\n\n".join([f"Context {i+1}:\n{ctx}" for i, ctx in enumerate(context)])
                prompt = f"""You are Guardian AI, a helpful medical assistant. Use the following context to answer the user's question accurately. If the context doesn't contain relevant information, provide a general helpful response.

Context:
{context_text}

User Question: {user_message}

Assistant Response:"""
            else:
                prompt = f"""You are Guardian AI, a helpful medical assistant. Provide a clear and accurate response to the user's question.

User Question: {user_message}

Assistant Response:"""
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            if not response or not response.text:
                logger.warning("⚠️  Empty response from Gemini")
                return "I apologize, but I couldn't generate a response. Please try again."
            
            logger.info(f"✅ Generated response ({len(response.text)} chars)")
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"❌ Error generating Gemini response: {str(e)}")
            raise Exception(f"Gemini generation failed: {str(e)}")
    
    async def generate_title(self, message: str) -> str:
        """
        Generate conversation title from first message
        
        Args:
            message: First user message
            
        Returns:
            Generated title (max 50 chars)
        """
        try:
            prompt = f"""Generate a very short title (3-5 words max) for a conversation that starts with this message:

"{message}"

Title:"""
            
            response = self.model.generate_content(prompt)
            title = response.text.strip().replace('"', '').replace("'", '')
            
            # Limit to 50 characters
            if len(title) > 50:
                title = title[:47] + "..."
            
            logger.info(f"✅ Generated title: {title}")
            return title
            
        except Exception as e:
            logger.error(f"❌ Error generating title: {str(e)}")
            return "New Conversation"
