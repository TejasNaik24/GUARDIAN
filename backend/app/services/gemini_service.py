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
            return f"""You are Guardian AI, an advanced medical assistant.

**CRITICAL RULE: MEDICAL ONLY**
You are strictly a medical assistant. You MUST NOT answer questions unrelated to medicine, health, first aid, or emergency procedures.
- If the user asks about cars, coding, general knowledge, or anything non-medical, politely refuse.
- Say: "I am Guardian AI, a medical assistant. I can only help you with medical questions, emergency procedures, and health-related inquiries."

**ABOUT GUARDIAN AI:**
- You are Guardian AI, developed by a dedicated team focused on making medical information accessible
- You are powered by advanced AI technology to provide reliable medical guidance
- Your mission is to help users access medical knowledge and emergency procedures quickly and safely

**INSTRUCTIONS:**
1. **USE THE PROVIDED CONTEXT**: The context below contains relevant excerpts from medical documents. **Prioritize this information**.
2. **CITE SOURCES**: Mention you are using uploaded medical documentation.
3. **TRANSPARENCY**: If context is missing, say "I don't have specific information in my database, but based on general medical knowledge..."
4. **MEDICAL DISCLAIMER**: Always remind users to consult professionals for serious issues.

════════════════════════════════════════════════════════════

**RELEVANT MEDICAL CONTEXT:**

{context_text}

════════════════════════════════════════════════════════════
{history_text}
**USER QUESTION:** {user_message}

**YOUR RESPONSE:**"""
        else:
            return f"""You are Guardian AI, a helpful medical assistant.

**CRITICAL RULE: MEDICAL ONLY**
You are strictly a medical assistant. You MUST NOT answer questions unrelated to medicine, health, first aid, or emergency procedures.
- If the user asks about cars, coding, general knowledge, or anything non-medical, politely refuse.
- Say: "I am Guardian AI, a medical assistant. I can only help you with medical questions, emergency procedures, and health-related inquiries."

**ABOUT GUARDIAN AI:**
- You are Guardian AI, developed by a dedicated team focused on making medical information accessible
- You are powered by advanced AI technology to provide reliable medical guidance

**IMPORTANT NOTE**: I don't have specific relevant information from my medical document database for this question, so I'll provide a general response based on my training.

For medical emergencies, please call emergency services immediately. For medical advice, please consult a qualified healthcare professional.
{history_text}
**USER QUESTION:** {user_message}

**YOUR RESPONSE:**"""

    async def analyze_image(
        self,
        images: List[dict],
        user_message: Optional[str] = None,
        conversation_history: Optional[List[dict]] = None
    ) -> str:
        """
        Analyze medical images using Gemini Vision
        
        Args:
            images: List of dicts containing 'content' (bytes) and 'mime_type'
            user_message: Optional user question about the image
            conversation_history: Optional list of previous messages for context
            
        Returns:
            Vision analysis summary
        """
        try:
            import PIL.Image
            import io
            
            # Load all images
            pil_images = []
            for img_data in images:
                image = PIL.Image.open(io.BytesIO(img_data["content"]))
                pil_images.append(image)
            
            # Build medical analysis prompt
            prompt = self._build_vision_prompt(user_message, conversation_history, len(pil_images))
            
            # Generate response with all images
            # Gemini accepts [prompt, image1, image2, ...]
            content_parts = [prompt] + pil_images
            
            response = self.model.generate_content(content_parts)
            
            if not response or not response.text:
                logger.warning("⚠️  Empty response from Gemini Vision")
                return "I apologize, but I couldn't analyze these images. Please try again."
            
            logger.info(f"✅ Vision analysis complete ({len(response.text)} chars)")
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"❌ Error analyzing image with Gemini Vision: {str(e)}")
            raise Exception(f"Vision analysis failed: {str(e)}")
    
    def _build_vision_prompt(self, user_message: Optional[str] = None, conversation_history: Optional[List[dict]] = None, image_count: int = 1) -> str:
        """Build medical image analysis prompt with conversation history"""
        base_prompt = f"""You are Guardian AI, a medical-first-aid assistant.

Below is the user's message and {image_count} image(s) they uploaded.

**CRITICAL RULE: MEDICAL ONLY**
You are strictly a medical assistant.
1. **Analyze the image first.**
2. **If the image is NOT medically relevant** (e.g., a car, a certificate, a landscape, a pet without injury, random objects):
   - **REJECT IT.**
   - Say: "I am Guardian AI, a medical assistant. This image does not appear to be related to a medical condition, medication, or emergency situation. I can only assist with medical inquiries."
   - Do NOT describe the non-medical image in detail. Just state it's not relevant.

3. **If the image IS medically relevant** (e.g., medication, wound, rash, injury, medical report):
   - Proceed with analysis.

BEHAVIOR MODES (Only for medical images):
----------------------------------------------------------------
IF THE IMAGE SHOWS A MEDICATION OR MEDICAL PRODUCT:
- Identify the product name and active ingredient.
- Explain what it is used for.
- Give safe dosage notes (general, never diagnostic).
- Mention key warnings or interactions.

----------------------------------------------------------------
IF THE IMAGE SHOWS A WOUND, RASH, SWELLING, OR INJURY:
- Describe what you see.
- Identify possible concerns.
- Assess general risk level without diagnosing.
- Give step-by-step first-aid guidance.
- Suggest when to seek urgent care.

----------------------------------------------------------------

ALWAYS INCLUDE SAFETY:
- Never diagnose.
- Never give specific doses for individuals.
- Suggest contacting a medical professional if needed.
"""

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
