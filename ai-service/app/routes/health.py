
# ===== health.py - SUPER SIMPLE VERSION =====
"""
Health check endpoints - SIMPLIFIED FOR RELIABILITY
"""

from fastapi import APIRouter, Response
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check(response: Response):
    """
    Ultra-simple health check
    Returns 200 if service is running
    """
    try:
        # Just check if we can respond
        return {
            "status": "UP",
            "service": "SnowGuard AI Service",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        response.status_code = 503
        return {
            "status": "DOWN",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/health/ready")
async def readiness_check(response: Response):
    """
    Readiness probe
    """
    try:
        # Check if we can import AI service
        from ..services.ai_service import ai_service
        
        return {
            "ready": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        response.status_code = 503
        return {
            "ready": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/health/live")
async def liveness_check():
    """
    Liveness probe - always returns success
    """
    return {
        "alive": True,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/detailed")
async def detailed_health_check(response: Response):
    """
    Detailed health check - only for debugging
    """
    from sqlalchemy import text
    from ..database import engine
    from ..config import settings
    
    status = {
        "status": "UP",
        "checks": {}
    }
    
    # Check database
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        status["checks"]["database"] = "UP"
    except Exception as e:
        status["checks"]["database"] = f"DOWN: {str(e)}"
        status["status"] = "DEGRADED"
    
    # Check Gemini config
    try:
        gemini_ok = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10)
        status["checks"]["gemini"] = "CONFIGURED" if gemini_ok else "NOT_CONFIGURED"
        if not gemini_ok:
            status["status"] = "DEGRADED"
    except Exception as e:
        status["checks"]["gemini"] = f"ERROR: {str(e)}"
        status["status"] = "DEGRADED"
    
    # Check AI service
    try:
        from ..services.ai_service import ai_service
        status["checks"]["ai_service"] = "INITIALIZED"
    except Exception as e:
        status["checks"]["ai_service"] = f"ERROR: {str(e)}"
        status["status"] = "DEGRADED"
    
    status["timestamp"] = datetime.utcnow().isoformat()
    
    if status["status"] != "UP":
        response.status_code = 503
    
    return status