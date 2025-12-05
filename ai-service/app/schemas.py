"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime


class LocationContext(BaseModel):
    """Location information for context"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")


class AccessibilityPreferences(BaseModel):
    """User accessibility preferences"""
    concise: bool = Field(default=False, description="Provide concise responses")
    tts: bool = Field(default=False, description="Text-to-speech enabled")
    fontSize: str = Field(default="medium", description="Font size preference")
    highContrast: bool = Field(default=False, description="High contrast mode")


class HazardContext(BaseModel):
    """Hazard information for context"""
    type: str = Field(..., description="Type of hazard")
    severity: int = Field(..., ge=0, le=100, description="Severity score")
    description: Optional[str] = Field(None, description="Hazard description")


class RouteContext(BaseModel):
    """Route information for context"""
    distance_m: Optional[float] = Field(None, description="Route distance in meters")
    duration_s: Optional[float] = Field(None, description="Estimated duration in seconds")
    risk_score: Optional[int] = Field(None, ge=0, le=100, description="Overall risk score")


class ChatContext(BaseModel):
    """Complete context for AI chat"""
    location: Optional[LocationContext] = None
    hazards: Optional[List[HazardContext]] = None
    route: Optional[RouteContext] = None
    preferences: Optional[AccessibilityPreferences] = None
    additional: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    user_id: Optional[int] = Field(None, description="User ID if authenticated")
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    context: Optional[ChatContext] = Field(None, description="Additional context")
    
    @validator('message')
    def validate_message(cls, v):
        """Ensure message is not just whitespace"""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "message": "Is it safe to walk to the pharmacy?",
                "context": {
                    "location": {"lat": 43.65, "lon": -79.38},
                    "hazards": [
                        {"type": "ICE", "severity": 75, "description": "Severe ice conditions"}
                    ],
                    "route": {"distance_m": 1200, "risk_score": 65},
                    "preferences": {"concise": True, "tts": True}
                }
            }
        }


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    reply: str = Field(..., description="AI-generated response")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Response confidence")
    suggestions: Optional[List[str]] = Field(None, description="Follow-up suggestions")
    warnings: Optional[List[str]] = Field(None, description="Safety warnings")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "reply": "Based on current ice conditions (severity 75), I recommend avoiding this route if possible. If you must go, wear ice cleats and allow extra time.",
                "confidence": 0.92,
                "suggestions": [
                    "Check if pharmacy offers delivery",
                    "Wait until conditions improve",
                    "Use public transit if available"
                ],
                "warnings": ["Severe ice conditions detected on your route"],
                "timestamp": "2025-11-08T12:00:00Z"
            }
        }

class ChatHistoryItem(BaseModel):
    """Single chat history item"""
    id: int
    prompt: str
    response: str
    created_at: str
    model_used: str
    tokens_used: Optional[int] = None
    chat_metadata: Dict[str, Any] = {}

    class Config:
        json_schema_extra = {
            "example": {
                "id": 123,
                "prompt": "Is it safe to go outside?",
                "response": "Based on current conditions...",
                "created_at": "2025-11-26T14:43:47.597593",
                "model_used": "gemini-2.5-flash",
                "tokens_used": 234,
                "chat_metadata": {
                    "confidence": 0.85,
                    "warnings": [],
                    "suggestions": ["Wear warm clothes", "Check forecast"]
                }
            }
        }

class ChatHistoryResponse(BaseModel):
    """Response for chat history endpoint"""
    user_id: int
    total_count: int = Field(..., description="Total number of chats for this user")
    count: int = Field(..., description="Number of chats in this response")
    limit: int
    offset: int
    chats: List[ChatHistoryItem]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "total_count": 25,
                "count": 10,
                "limit": 10,
                "offset": 0,
                "chats": [
                    {
                        "id": 123,
                        "prompt": "Is it safe to go outside?",
                        "response": "Based on current conditions...",
                        "created_at": "2025-11-26T14:43:47.597593",
                        "model_used": "gemini-2.5-flash",
                        "tokens_used": 234,
                        "chat_metadata": {}
                    }
                ]
            }
        }

class SafetyAnalysisRequest(BaseModel):
    """Request for safety analysis"""
    location: LocationContext
    destination: Optional[LocationContext] = None
    preferences: Optional[AccessibilityPreferences] = None

class SafetyAnalysisResponse(BaseModel):
    """Response for safety analysis"""
    safety_score: int = Field(..., ge=0, le=100, description="Overall safety score")
    analysis: str = Field(..., description="Safety analysis text")
    recommendations: List[str] = Field(..., description="Safety recommendations")
    hazards_detected: List[HazardContext] = Field(..., description="Detected hazards")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    timestamp: datetime
    openai_configured: bool
    database_connected: bool
    
