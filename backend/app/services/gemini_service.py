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
        # Use gemini-2.5-flash which is available in your API
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        logger.info("✅ Gemini service initialized with gemini-2.5-flash")
    
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
            prompt = self._build_prompt(user_message, context)
            
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

    async def generate_response_stream(
        self,
        user_message: str,
        context: Optional[List[str]] = None
    ):
        """
        Generate streaming response using Gemini
        
        Args:
            user_message: User's input message
            context: List of relevant context strings from RAG
            
        Yields:
            Chunks of generated text
        """
        try:
            # Build prompt with context
            prompt = self._build_prompt(user_message, context)
            
            # Generate streaming response
            response = self.model.generate_content(prompt, stream=True)
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            
            logger.info("✅ Generated streaming response")
            
        except Exception as e:
            logger.error(f"❌ Error generating Gemini streaming response: {str(e)}")
            raise Exception(f"Gemini streaming failed: {str(e)}")

    def _build_prompt(self, user_message: str, context: Optional[List[str]] = None) -> str:
        """Helper to build the prompt with context"""
        if context and len(context) > 0:
            context_text = "\n\n---\n\n".join([f"**Context Chunk {i+1}:**\n{ctx}" for i, ctx in enumerate(context)])
            return f"""You are Guardian AI, an advanced medical assistant with access to a comprehensive database of medical documentation, emergency procedures, and first-aid guidelines.

**CRITICAL INSTRUCTIONS:**
1. **USE THE PROVIDED CONTEXT**: The context below contains relevant excerpts from medical documents that have been uploaded to your knowledge base. **You MUST prioritize information from this context** when answering the user's question.

2. **CITE YOUR SOURCES**: When using information from the context, mention that you're referencing uploaded medical documentation. You can say things like:
   - "According to the medical documentation in my knowledge base..."
   - "Based on the emergency procedures I have access to..."
   - "The medical guidelines indicate that..."

3. **BE TRANSPARENT**: If the context doesn't contain relevant information for the user's question, clearly state: "I don't have specific information about this in my uploaded medical database, but based on general medical knowledge..." and then provide your best general answer.

4. **ACCURACY OVER COMPLETENESS**: Only include information you're confident about. If the context is unclear or contradictory, acknowledge this.

5. **MEDICAL DISCLAIMER**: For serious medical situations, always remind users to consult healthcare professionals or call emergency services.

════════════════════════════════════════════════════════════

**RELEVANT MEDICAL CONTEXT FROM DATABASE:**

{context_text}

════════════════════════════════════════════════════════════

**USER QUESTION:** {user_message}

**YOUR RESPONSE (remember to use the context above):**"""
        else:
            return f"""You are Guardian AI, a helpful medical assistant. 

**IMPORTANT NOTE**: I don't have specific relevant information from my medical document database for this question, so I'll provide a general response based on my training.

For medical emergencies, please call emergency services immediately. For medical advice, please consult a qualified healthcare professional.

**USER QUESTION:** {user_message}

**YOUR RESPONSE:**"""
    
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
