# ===== config.py =====
"""
Configuration settings for AI Service (Gemini Only)
"""

from pydantic_settings import BaseSettings
from typing import List
import os
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "SnowGuard AI Service"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8003"))
    
    # Gemini Configuration (ONLY AI PROVIDER)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
    
    # Generation Parameters
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "1000"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@postgres:5432/aidb"
    )
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://frontend:3000"
    ]
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))
    
    # Safety Settings
    MAX_PROMPT_LENGTH: int = int(os.getenv("MAX_PROMPT_LENGTH", "2000"))
    ENABLE_CONTENT_FILTER: bool = os.getenv("ENABLE_CONTENT_FILTER", "true").lower() == "true"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    ENABLE_CHAT_LOGGING: bool = os.getenv("ENABLE_CHAT_LOGGING", "true").lower() == "true"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._validate_config()
    
    def _validate_config(self):
        """Validate Gemini configuration on startup"""
        if not self.GEMINI_API_KEY:
            logger.error("❌ GEMINI_API_KEY not configured!")
            raise ValueError("GEMINI_API_KEY is required")
        
        logger.info(f"✅ Gemini API key configured (model: {self.GEMINI_MODEL})")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()