from typing import List, Optional, Dict, Any
from app.services.gemini_service import GeminiService

class LLMClient:
    """
    Wrapper around GeminiService to provide a unified interface for agents.
    Allows for easier mocking and potential future model swapping.
    """
    
    def __init__(self):
        self.gemini = GeminiService()

    async def generate_text(
        self, 
        prompt: str, 
        system_instruction: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7
    ) -> str:
        """
        Generate text from the LLM.
        
        Args:
            prompt: The user prompt or combined prompt.
            system_instruction: Optional system instruction (prepended to prompt for now as GeminiService handles it internally via prompt construction, but we can pass it if needed).
            max_tokens: Max output tokens.
            temperature: Creativity control.
            
        Returns:
            Generated text string.
        """
        # Note: GeminiService currently abstracts the model call. 
        # We'll use its generate_response method but bypass the internal prompt builder 
        # if we want raw control, or use it if we want the standard wrapper.
        # For agents, we often want raw control over the prompt.
        
        # Direct model access for more control
        try:
            generation_config = {
                "temperature": temperature,
            }
            if max_tokens:
                generation_config["max_output_tokens"] = max_tokens

            # If system instruction is provided, we might need to configure the model differently
            # or just prepend it. For this MVP, we'll prepend it to the prompt.
            full_prompt = prompt
            if system_instruction:
                full_prompt = f"{system_instruction}\n\n{prompt}"

            response = self.gemini.model.generate_content(
                full_prompt, 
                generation_config=generation_config
            )
            
            if response and response.text:
                return response.text.strip()
            return ""
            
        except Exception as e:
            # Fallback to standard service if direct access fails or for consistency
            print(f"LLMClient Error: {e}")
            return ""

    async def analyze_image(
        self,
        image_bytes: bytes,
        prompt: str
    ) -> str:
        """
        Analyze an image with a prompt.
        """
        try:
            # Re-use GeminiService's logic but with custom prompt
            import PIL.Image
            import io
            
            image = PIL.Image.open(io.BytesIO(image_bytes))
            
            response = self.gemini.model.generate_content([prompt, image])
            
            if response and response.text:
                return response.text.strip()
            return ""
            
        except Exception as e:
            print(f"LLMClient Vision Error: {e}")
            return ""

llm_client = LLMClient()
