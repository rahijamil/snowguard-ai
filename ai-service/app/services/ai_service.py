"""
AI Service with robust Gemini error handling and response extraction
"""

import logging
from typing import Optional, Dict, Any, List
import google.generativeai as genai
import time

from ..config import settings
from ..schemas import ChatContext

logger = logging.getLogger(__name__)


class AIService:
    """AI service using Google Gemini with robust error handling"""
    
    def __init__(self):
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            logger.info(f"✅ AI Service initialized with Gemini model: {settings.GEMINI_MODEL}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {str(e)}")
            raise

    async def generate_response(
        self,
        user_message: str,
        context: Optional[ChatContext] = None
    ) -> Dict[str, Any]:
        """
        Generate AI response using Gemini with robust error handling
        """
        try:
            # Build the complete prompt
            full_prompt = self._build_prompt(user_message, context)
            
            logger.info(f"Sending request to Gemini: {user_message[:100]}...")
            logger.debug(f"Full prompt length: {len(full_prompt)} characters")
            
            # Generate response with retry logic
            max_retries = 3
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    # Use simpler generation settings
                    response = self.model.generate_content(
                        full_prompt,
                        generation_config=genai.GenerationConfig(
                            temperature=0.7,
                            max_output_tokens=1000,
                            top_p=0.95,
                            top_k=40,
                        )
                    )
                    
                    # Debug: Log the raw response structure
                    logger.debug(f"Response type: {type(response)}")
                    logger.debug(f"Has candidates: {hasattr(response, 'candidates')}")
                    if hasattr(response, 'candidates'):
                        logger.debug(f"Number of candidates: {len(response.candidates)}")
                    
                    # Extract text with robust methods
                    reply = self._extract_text_safely(response)
                    
                    if reply:
                        # Success! Extract token count
                        tokens_used = None
                        try:
                            if hasattr(response, 'usage_metadata'):
                                usage = response.usage_metadata
                                if hasattr(usage, 'total_token_count'):
                                    tokens_used = usage.total_token_count
                        except Exception:
                            pass
                        
                        logger.info(f"✅ Gemini response generated successfully (attempt {attempt + 1}, {len(reply)} chars)")
                        
                        return {
                            "reply": reply,
                            "tokens_used": tokens_used,
                            "model": settings.GEMINI_MODEL,
                            "confidence": self._calculate_confidence(context),
                            "suggestions": self._extract_suggestions(reply),
                            "warnings": self._extract_warnings(context)
                        }
                    else:
                        # Check if response was blocked
                        if hasattr(response, 'prompt_feedback'):
                            feedback = response.prompt_feedback
                            logger.warning(f"Prompt feedback: {feedback}")
                            if hasattr(feedback, 'block_reason'):
                                last_error = f"Response blocked: {feedback.block_reason}"
                                logger.warning(last_error)
                                # Use fallback for blocked content
                                break
                        
                        last_error = "Empty response from Gemini"
                        logger.warning(f"Empty response on attempt {attempt + 1}")
                        
                        # Wait before retry
                        if attempt < max_retries - 1:
                            wait_time = (attempt + 1) * 2
                            logger.info(f"Waiting {wait_time}s before retry...")
                            time.sleep(wait_time)
                        
                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"Attempt {attempt + 1} failed: {last_error}")
                    
                    # Wait before retry
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 2
                        logger.info(f"Waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
            
            # All retries failed - use fallback
            logger.error(f"All attempts failed. Last error: {last_error}")
            raise Exception(f"Failed after {max_retries} attempts. Last error: {last_error}")
            
        except Exception as e:
            logger.error(f"Gemini generation failed: {str(e)}", exc_info=True)
            
            # Return a helpful fallback response
            return {
                "reply": self._get_fallback_response(user_message, context),
                "tokens_used": None,
                "model": settings.GEMINI_MODEL,
                "confidence": 0.3,
                "suggestions": self._get_fallback_suggestions(),
                "warnings": ["AI service temporarily unavailable - showing fallback response"]
            }

    def _extract_text_safely(self, response) -> str:
        """
        Safely extract text from Gemini response with multiple fallback methods
        """
        # Method 1: Standard response.text property (most common)
        try:
            if hasattr(response, 'text') and response.text:
                text = response.text.strip()
                if text:
                    logger.debug(f"✅ Extracted via response.text: {len(text)} chars")
                    return text
        except Exception as e:
            logger.debug(f"response.text failed: {str(e)}")
        
        # Method 2: Through candidates[0].content.parts[0].text
        try:
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    parts = candidate.content.parts
                    if parts:
                        texts = []
                        for part in parts:
                            if hasattr(part, 'text') and part.text:
                                texts.append(part.text)
                        
                        if texts:
                            text = " ".join(texts).strip()
                            logger.debug(f"✅ Extracted via candidates: {len(text)} chars")
                            return text
        except Exception as e:
            logger.debug(f"candidates extraction failed: {str(e)}")
        
        # Method 3: Check if response itself can be stringified
        try:
            text = str(response)
            # Filter out debug strings
            if text and "GenerateContentResponse" not in text and len(text) > 10:
                logger.debug(f"✅ Extracted via str(response): {len(text)} chars")
                return text.strip()
        except Exception as e:
            logger.debug(f"str(response) failed: {str(e)}")
        
        logger.warning("❌ All extraction methods failed - returning empty string")
        return ""

    def _build_prompt(self, user_message: str, context: Optional[ChatContext]) -> str:
        """Build complete prompt with system instructions and context"""
        
        # Simplified system prompt to avoid content filtering
        system_prompt = """You are SnowGuard AI, a helpful winter safety assistant.

Provide clear, practical advice for winter conditions. Focus on:
- User safety and well-being
- Specific, actionable recommendations
- Clear, simple language
- Empathetic and supportive tone

When giving advice:
- Be concise and direct
- Prioritize safety
- Offer alternatives when conditions are dangerous
- Use everyday language

Respond naturally and helpfully to the user's question."""

        # Add context information if available
        context_info = ""
        if context:
            parts = []
            
            if context.location:
                parts.append(f"User location: {context.location.lat:.4f}, {context.location.lon:.4f}")
            
            if context.hazards and len(context.hazards) > 0:
                hazard_list = []
                for h in context.hazards:
                    severity = "minor" if h.severity <= 30 else "moderate" if h.severity <= 60 else "severe" if h.severity <= 80 else "extreme"
                    hazard_list.append(f"- {h.type}: {severity} ({h.severity}/100)")
                if hazard_list:
                    parts.append("Current conditions:\n" + "\n".join(hazard_list))
            
            if parts:
                context_info = "\n\n".join(parts)
        
        # Combine all parts (simplified to avoid triggering safety filters)
        if context_info:
            return f"{system_prompt}\n\n{context_info}\n\nUser: {user_message}\n\nAssistant:"
        else:
            return f"{system_prompt}\n\nUser: {user_message}\n\nAssistant:"

    def _build_context_message(self, context: ChatContext) -> str:
        """Build context information for the prompt"""
        parts = []
        
        if context.location:
            parts.append(f"Location: {context.location.lat:.4f}, {context.location.lon:.4f}")
        
        if context.hazards and len(context.hazards) > 0:
            hazard_info = []
            for h in context.hazards:
                severity_label = self._get_severity_label(h.severity)
                hazard_info.append(f"- {h.type}: {severity_label} (severity {h.severity}/100)")
            parts.append("Current hazards:\n" + "\n".join(hazard_info))
        
        return "\n\n".join(parts) if parts else ""

    def _get_severity_label(self, severity: int) -> str:
        """Get severity label from score"""
        if severity <= 30:
            return "minor"
        elif severity <= 60:
            return "moderate"
        elif severity <= 80:
            return "severe"
        else:
            return "extreme"

    def _calculate_confidence(self, context: Optional[ChatContext]) -> float:
        """Calculate confidence score based on available context"""
        if not context:
            return 0.6
        
        score = 0.5
        if context.location:
            score += 0.15
        if context.hazards and len(context.hazards) > 0:
            score += 0.2
        if context.route:
            score += 0.15
        
        return min(score, 0.95)

    def _extract_suggestions(self, reply: str) -> List[str]:
        """Extract actionable suggestions from reply"""
        suggestions = []
        lines = reply.split('\n')
        for line in lines:
            stripped = line.strip()
            if stripped and len(stripped) > 0:
                first_char = stripped[0] if stripped else ''
                if first_char.isdigit() or first_char in ['-', '•', '*', '·']:
                    cleaned = stripped.lstrip('0123456789.-•*· ').strip()
                    if 10 < len(cleaned) < 200:
                        suggestions.append(cleaned)
        return suggestions[:5]

    def _extract_warnings(self, context: Optional[ChatContext]) -> List[str]:
        """Extract critical warnings based on context"""
        warnings: List[str] = []
        if not context or not context.hazards:
            return warnings
        
        for hazard in context.hazards:
            if hazard.severity >= 80:
                warnings.append(f"Extreme {hazard.type.lower()} conditions - avoid travel")
            elif hazard.severity >= 60:
                warnings.append(f"Severe {hazard.type.lower()} conditions - exercise caution")
        
        return warnings

    def _get_fallback_response(self, user_message: str, context: Optional[ChatContext]) -> str:
        """Generate a helpful fallback response when AI fails"""
        
        # Check for specific question patterns
        message_lower = user_message.lower()
        
        # Check if we have hazard context
        if context and context.hazards:
            max_severity = max((h.severity for h in context.hazards), default=0)
            
            if max_severity >= 80:
                return """Based on current conditions, I can see EXTREME winter hazards in your area.

⚠️ Safety Recommendations:
• Avoid all non-essential travel
• Stay indoors if possible
• If you must go out:
  - Wear insulated, waterproof clothing
  - Use proper winter footwear with good traction
  - Tell someone your plans and expected return time
  - Keep your phone fully charged
  - Bring emergency supplies

For immediate assistance, contact local emergency services.

Stay safe! The AI assistant will be back online shortly."""
            
            elif max_severity >= 60:
                return """Current conditions show SEVERE winter hazards.

⚠️ Safety Recommendations:
• Exercise extreme caution if you must travel
• Wear appropriate winter clothing and footwear
• Allow extra time for your journey
• Avoid steep slopes and icy areas
• Keep emergency contacts handy
• Watch for black ice on roads and walkways

Consider postponing non-urgent trips until conditions improve.

The AI assistant is temporarily unavailable, but will respond normally soon."""
            
            else:
                return """Current winter conditions appear moderate.

General Safety Tips:
• Wear proper footwear with good traction
• Take your time and watch your step
• Use handrails where available
• Be extra careful on bridges and shaded areas
• Dress in layers for changing conditions

The AI assistant is experiencing technical difficulties and will be back shortly. 
Please try your question again in a moment."""
        
        # No hazard context - provide general advice
        return """I apologize for the temporary service interruption.

General Winter Safety Advice:
• Check weather conditions before going out
• Dress appropriately in layers
• Wear proper winter footwear
• Tell someone your plans
• Keep your phone charged
• Allow extra time for travel
• Watch for ice on walkways and roads

The AI assistant will be available again shortly. Thank you for your patience!"""

    def _get_fallback_suggestions(self) -> List[str]:
        """Get fallback suggestions"""
        return [
            "Check local weather updates",
            "Wear appropriate winter clothing",
            "Allow extra time for travel",
            "Keep emergency contacts handy",
            "Stay informed about conditions"
        ]


# Create singleton instance
ai_service = AIService()