"""
AI Service with robust Gemini error handling and safety filter bypassing
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
            
            # Configure safety settings to be more permissive
            self.safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                },
            ]
            
            self.model = genai.GenerativeModel(
                settings.GEMINI_MODEL,
                safety_settings=self.safety_settings
            )
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
            
            # Generate response with retry logic
            max_retries = 2  # Reduced retries since we have better error handling
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    # Generate with safety settings
                    response = self.model.generate_content(
                        full_prompt,
                        generation_config=genai.GenerationConfig(
                            temperature=0.7,
                            max_output_tokens=1500,
                            top_p=0.95,
                            top_k=40,
                        ),
                        safety_settings=self.safety_settings
                    )
                    
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
                        block_reason = None
                        if hasattr(response, 'prompt_feedback'):
                            feedback = response.prompt_feedback
                            if hasattr(feedback, 'block_reason') and feedback.block_reason:
                                block_reason = str(feedback.block_reason)
                                logger.warning(f"⚠️ Response blocked: {block_reason}")
                        
                        # Check candidates for finish_reason
                        if hasattr(response, 'candidates') and response.candidates:
                            candidate = response.candidates[0]
                            if hasattr(candidate, 'finish_reason'):
                                finish_reason = str(candidate.finish_reason)
                                logger.warning(f"⚠️ Finish reason: {finish_reason}")
                                
                                # If blocked by safety, use fallback immediately
                                if 'SAFETY' in finish_reason:
                                    logger.info("🔄 Safety block detected - using contextual fallback")
                                    return self._get_smart_fallback_response(user_message, context)
                        
                        last_error = f"Empty response (block_reason: {block_reason})"
                        
                        # Don't retry if it was a safety block
                        if block_reason:
                            break
                        
                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"Attempt {attempt + 1} failed: {last_error}")
                    
                    # Wait before retry
                    if attempt < max_retries - 1:
                        time.sleep(1)
            
            # Use smart fallback
            logger.info("🔄 Using smart fallback response")
            return self._get_smart_fallback_response(user_message, context)
            
        except Exception as e:
            logger.error(f"Gemini generation failed: {str(e)}", exc_info=True)
            return self._get_smart_fallback_response(user_message, context)

    def _extract_text_safely(self, response) -> str:
        """
        Safely extract text from Gemini response with multiple fallback methods
        """
        # Method 1: Standard response.text property
        try:
            if hasattr(response, 'text') and response.text:
                text = response.text.strip()
                if text:
                    return text
        except Exception:
            pass
        
        # Method 2: Through candidates
        try:
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    parts = candidate.content.parts
                    if parts:
                        texts = [part.text for part in parts if hasattr(part, 'text') and part.text]
                        if texts:
                            return " ".join(texts).strip()
        except Exception:
            pass
        
        return ""

    def _build_prompt(self, user_message: str, context: Optional[ChatContext]) -> str:
        """Build complete prompt - simplified to avoid safety filters"""
        
        # Very simple, neutral system prompt
        system = "You are a helpful winter safety assistant. Provide clear, practical advice."
        
        # Add context if available
        context_parts = []
        if context:
            if context.location:
                context_parts.append(f"Location: {context.location.lat:.2f}, {context.location.lon:.2f}")
            
            if context.hazards and len(context.hazards) > 0:
                hazards = []
                for h in context.hazards:
                    severity = "low" if h.severity <= 40 else "moderate" if h.severity <= 70 else "high"
                    hazards.append(f"{h.type.lower()}: {severity}")
                if hazards:
                    context_parts.append(f"Conditions: {', '.join(hazards)}")
        
        # Combine
        if context_parts:
            return f"{system}\n\n{' | '.join(context_parts)}\n\nQuestion: {user_message}\n\nAnswer:"
        else:
            return f"{system}\n\nQuestion: {user_message}\n\nAnswer:"

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
            if stripped and len(stripped) > 10:
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
                warnings.append(f"Extreme {hazard.type.lower().replace('_', ' ')} conditions detected")
            elif hazard.severity >= 60:
                warnings.append(f"Severe {hazard.type.lower().replace('_', ' ')} conditions present")
        
        return warnings

    def _get_smart_fallback_response(self, user_message: str, context: Optional[ChatContext]) -> Dict[str, Any]:
        """
        Generate intelligent fallback response based on context
        """
        message_lower = user_message.lower()
        
        # Analyze context for severity
        max_severity = 0
        hazard_types = []
        if context and context.hazards:
            max_severity = max((h.severity for h in context.hazards), default=0)
            hazard_types = [h.type.lower().replace('_', ' ') for h in context.hazards]
        
        # Generate contextual response
        if max_severity >= 80:
            reply = f"""⚠️ **Extreme Weather Alert**

Current conditions show extreme winter hazards ({', '.join(hazard_types) if hazard_types else 'severe weather'}).

**Immediate Safety Actions:**
• Stay indoors - avoid all non-essential travel
• If you must go out:
  - Dress in multiple warm layers
  - Wear insulated, waterproof boots with deep treads
  - Inform someone of your plans and route
  - Carry a fully charged phone
  - Bring emergency supplies (water, snacks, blanket)

**For Emergencies:**
• Call 911 if you're in danger
• Seek immediate shelter if caught outside
• Avoid overexertion in extreme cold

These conditions are dangerous. Please prioritize your safety."""

        elif max_severity >= 60:
            reply = f"""⚠️ **Severe Weather Conditions**

Current hazards include {', '.join(hazard_types) if hazard_types else 'winter weather'} at severe levels.

**Safety Recommendations:**
• Exercise extreme caution if going outside
• Essential travel only
• Proper winter gear required:
  - Insulated waterproof jacket
  - Winter boots with good traction
  - Warm hat and gloves
• Allow extra time for any journey
• Watch for ice, especially on bridges and shaded areas
• Keep emergency contacts accessible

**Travel Tips:**
• Walk slowly and carefully
• Use handrails where available
• Avoid shortcuts through uncleared areas
• If driving, reduce speed significantly

Consider delaying non-urgent activities until conditions improve."""

        elif max_severity >= 30:
            reply = f"""Winter Weather Advisory

Moderate hazards detected: {', '.join(hazard_types) if hazard_types else 'winter conditions present'}.

**Safety Tips:**
• Wear appropriate winter footwear with good grip
• Dress in layers - easier to adjust to activity level
• Take your time - rushing increases slip risk
• Use designated walkways when possible
• Be extra careful on:
  - Bridge surfaces
  - Shaded areas
  - Slopes and hills
  - Parking lots

**General Advice:**
• Keep your phone charged
• Let someone know your plans
• Carry identification
• Watch weather updates

Conditions are manageable with proper precautions. Stay alert and take your time."""

        else:
            # Pattern matching for common questions
            if any(word in message_lower for word in ['safe', 'outside', 'go out']):
                reply = """Based on current information, here's general winter safety guidance:

**Before Going Out:**
• Check current weather conditions
• Dress appropriately for temperature
• Wear footwear with good traction
• Plan your route

**While Outside:**
• Take your time - don't rush
• Watch for icy patches, especially in shaded areas
• Use handrails on stairs
• Be visible to drivers in low light

**General Tips:**
• Keep your phone charged
• Tell someone your plans
• Carry emergency contacts
• Stay hydrated even in cold weather

Stay aware of your surroundings and trust your instincts about safety."""

            elif any(word in message_lower for word in ['wear', 'clothing', 'dress']):
                reply = """**Winter Clothing Recommendations:**

**Layering System:**
• Base layer: Moisture-wicking fabric (avoid cotton)
• Middle layer: Insulating fleece or wool
• Outer layer: Windproof and waterproof jacket

**Essential Items:**
• Insulated, waterproof boots with deep treads
• Warm hat (significant heat loss through head)
• Insulated gloves or mittens
• Scarf or neck warmer
• Moisture-wicking socks (wool or synthetic)

**Additional Tips:**
• Dress for the coldest part of your journey
• Carry an extra layer in case conditions change
• Avoid overheating - adjust layers as needed
• Keep extremities covered in severe cold

Remember: It's easier to remove layers than to add them if you don't have them!"""

            elif any(word in message_lower for word in ['ice', 'slip', 'fall']):
                reply = """**Preventing Slips and Falls on Ice:**

**Footwear:**
• Wear boots with deep, rubber treads
• Consider ice cleats or traction aids
• Avoid smooth-soled shoes

**Walking Technique:**
• Take short, slow steps (penguin walk)
• Keep your center of gravity over your front leg
• Walk flat-footed for better traction
• Avoid hands in pockets (need arms for balance)
• Don't carry heavy items that obstruct your view

**High-Risk Areas:**
• Building entrances and exits
• Parking lots
• Bridges and overpasses
• Shaded areas
• Areas near downspouts
• Polished surfaces indoors after snow

**If You Start to Slip:**
• Relax your body
• Try to fall backward if possible (protects head)
• Extend arms to break fall
• Roll with the fall to distribute impact

Prevention is key - take your time and stay alert!"""

            else:
                reply = """I'm here to help with winter safety! Here are some topics I can assist with:

**Safety Assessment:**
• Is it safe to go outside now?
• Current weather conditions
• Risk levels for travel

**Preparation:**
• What to wear in winter
• How to prepare for winter weather
• Essential items to carry

**Navigation:**
• Safe route planning
• Avoiding hazardous areas
• Transportation safety

**Prevention:**
• Preventing slips and falls
• Ice safety tips
• Cold weather precautions

Feel free to ask about any winter safety concern. Stay safe out there!"""
        
        return {
            "reply": reply,
            "tokens_used": None,
            "model": settings.GEMINI_MODEL,
            "confidence": 0.7 if max_severity > 0 else 0.5,
            "suggestions": self._extract_suggestions(reply),
            "warnings": self._extract_warnings(context)
        }


# Create singleton instance
ai_service = AIService()