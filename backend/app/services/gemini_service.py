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
        context: Optional[List[str]] = None,
        conversation_history: Optional[List[dict]] = None
    ) -> str:
        """
        Generate response using Gemini with optional RAG context
        
        Args:
            user_message: User's input message
            context: List of relevant context strings from RAG
            conversation_history: Optional list of previous messages for context
            
        Returns:
            Generated response text
        """
        try:
            # Build prompt with context
            prompt = self._build_prompt(user_message, context, conversation_history)
            
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
        context: Optional[List[str]] = None,
        conversation_history: Optional[List[dict]] = None
    ):
        """
        Generate streaming response using Gemini
        
        Args:
            user_message: User's input message
            context: List of relevant context strings from RAG
            conversation_history: Optional list of previous messages for context
            
        Yields:
            Chunks of generated text
        """
        try:
            # Build prompt with context
            prompt = self._build_prompt(user_message, context, conversation_history)
            
            # Generate streaming response
            response = self.model.generate_content(prompt, stream=True)
            
            response_generated = False
            for chunk in response:
                # Check if response was blocked by safety filters
                if hasattr(chunk, 'candidates') and chunk.candidates:
                    candidate = chunk.candidates[0]
                    if hasattr(candidate, 'finish_reason') and candidate.finish_reason:
                        finish_reason = str(candidate.finish_reason)
                        if 'SAFETY' in finish_reason:
                            logger.warning(f"⚠️ Response blocked by safety filters: {finish_reason}")
                            yield "I apologize, but I cannot provide a response to this query due to safety guidelines. Please rephrase your question or ask something else."
                            return
                
                if chunk.text:
                    response_generated = True
                    yield chunk.text
            
            if not response_generated:
                logger.warning("⚠️ No response generated (possibly blocked by safety filters)")
                yield "I apologize, but I couldn't generate a response. This might be due to safety guidelines. Please try rephrasing your question."
            else:
                logger.info("✅ Generated streaming response")
            
        except Exception as e:
            logger.error(f"❌ Error generating Gemini streaming response: {str(e)}")
            raise Exception(f"Gemini streaming failed: {str(e)}")

    def _build_prompt(self, user_message: str, context: Optional[List[str]] = None, conversation_history: Optional[List[dict]] = None) -> str:
        """Helper to build the prompt with context"""
        # Format conversation history if provided
        history_text = ""
        if conversation_history and len(conversation_history) > 0:
            recent_messages = conversation_history[-10:]
            history_lines = []
            for msg in recent_messages:
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role == "user":
                    history_lines.append(f"User: {content}")
                elif role == "assistant":
                    history_lines.append(f"Guardian AI: {content}")
            
            if history_lines:
                history_text = "\n\n**PREVIOUS CONVERSATION:**\n" + "\n".join(history_lines) + "\n"

        if context and len(context) > 0:
            context_text = "\n\n---\n\n".join([f"**Context Chunk {i+1}:**\n{ctx}" for i, ctx in enumerate(context)])
            return f"""You are Guardian AI, an advanced medical assistant with access to a comprehensive database of medical documentation, emergency procedures, and first-aid guidelines.

**ABOUT GUARDIAN AI:**
- You are Guardian AI, developed by a dedicated team focused on making medical information accessible
- You are powered by advanced AI technology to provide reliable medical guidance
- Your mission is to help users access medical knowledge and emergency procedures quickly and safely

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
{history_text}
**USER QUESTION:** {user_message}

**YOUR RESPONSE (remember to use the context above):**"""
        else:
            return f"""You are Guardian AI, a helpful medical assistant.

**ABOUT GUARDIAN AI:**
- You are Guardian AI, developed by a dedicated team focused on making medical information accessible
- You are powered by advanced AI technology to provide reliable medical guidance
- Your mission is to help users access medical knowledge and emergency procedures quickly and safely

**IMPORTANT NOTE**: I don't have specific relevant information from my medical document database for this question, so I'll provide a general response based on my training.

For medical emergencies, please call emergency services immediately. For medical advice, please consult a qualified healthcare professional.
{history_text}
**USER QUESTION:** {user_message}

**YOUR RESPONSE:**"""

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_message: Optional[str] = None,
        conversation_history: Optional[List[dict]] = None
    ) -> str:
        """
        Analyze medical image using Gemini Vision
        
        Args:
            image_bytes: Image file bytes
            mime_type: Image MIME type (image/jpeg, etc.)
            user_message: Optional user question about the image
            conversation_history: Optional list of previous messages for context
            
        Returns:
            Vision analysis summary
        """
        try:
            import PIL.Image
            import io
            
            # Load image from bytes
            image = PIL.Image.open(io.BytesIO(image_bytes))
            
            # Build medical analysis prompt
            prompt = self._build_vision_prompt(user_message, conversation_history)
            
            # Generate response with image
            response = self.model.generate_content([prompt, image])
            
            if not response or not response.text:
                logger.warning("⚠️  Empty response from Gemini Vision")
                return "I apologize, but I couldn't analyze this image. Please try again."
            
            logger.info(f"✅ Vision analysis complete ({len(response.text)} chars)")
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"❌ Error analyzing image with Gemini Vision: {str(e)}")
            raise Exception(f"Vision analysis failed: {str(e)}")
    
    def _build_vision_prompt(self, user_message: Optional[str] = None, conversation_history: Optional[List[dict]] = None) -> str:
        """Build medical image analysis prompt with conversation history"""
        base_prompt = """You are Guardian AI, a medical-first-aid assistant.

Below is the user's message and an image they uploaded.
Your job is to combine BOTH pieces of information.

PRIORITY ORDER:
1. First, understand the user's text message.
2. Second, analyze the image.
3. Then answer the user directly, clearly, and concisely.

BEHAVIOR MODES:
----------------------------------------------------------------
IF THE IMAGE SHOWS A MEDICATION OR MEDICAL PRODUCT:
- Identify the product name and active ingredient.
- Explain what it is used for.
- Give safe dosage notes (general, never diagnostic).
- Mention key warnings or interactions.
- Keep it conversational and helpful.
Example tone:
  "Yes, this is Advil (ibuprofen 200 mg). It's used for pain, fever, inflammation..."

----------------------------------------------------------------
IF THE IMAGE SHOWS A WOUND, RASH, SWELLING, OR INJURY:
- Describe what you see.
- Identify possible concerns.
- Assess general risk level without diagnosing.
- Give step-by-step first-aid guidance.
- Suggest when to seek urgent care.

----------------------------------------------------------------
IF THE IMAGE SHOWS A NON-MEDICAL OBJECT:
- Identify it.
- Respond to the user's question directly.
- Do NOT generate medical guidance unless relevant.

----------------------------------------------------------------

ALWAYS INCLUDE SAFETY:
- Never diagnose.
- Never give specific doses for individuals.
- Suggest contacting a medical professional if needed.

FINAL FORMAT (depending on context):
- Direct answer to user question.
- Identification.
- Helpful explanation.
- Optional safety note."""

        # Add conversation history if provided
        history_text = ""
        if conversation_history and len(conversation_history) > 0:
            # Format last 10 messages for context
            recent_messages = conversation_history[-10:]
            history_lines = []
            for msg in recent_messages:
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role == "user":
                    history_lines.append(f"User: {content}")
                elif role == "assistant":
                    history_lines.append(f"Guardian AI: {content}")
            
            if history_lines:
                history_text = "\n\n**PREVIOUS CONVERSATION:**\n" + "\n".join(history_lines) + "\n"

        if user_message:
            return f"{base_prompt}{history_text}\n\n**USER QUESTION:** {user_message}\n\n**YOUR RESPONSE:**"
        else:
            return f"{base_prompt}{history_text}\n\n**YOUR RESPONSE:**"
    
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
