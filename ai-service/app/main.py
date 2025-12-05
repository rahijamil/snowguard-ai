# ===== main.py =====
"""
SnowGuard AI - AI Service
FastAPI service for AI-powered safety guidance and chat assistance
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import sys

from .routes import chat, health
from .config import settings
from .database import engine, Base

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management for the application"""
    logger.info("🚀 Starting SnowGuard AI Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Gemini Model: {settings.GEMINI_MODEL}")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        logger.warning("⚠️ Service will continue but may have limited functionality")
    
    # Initialize Gemini AI Service
    try:
        from .services.ai_service import ai_service
        logger.info("✅ Gemini AI Service initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Gemini: {str(e)}")
        logger.warning("⚠️ AI features may not work correctly")
    
    logger.info("✅ AI Service startup complete")
    
    yield
    
    logger.info("🛑 Shutting down SnowGuard AI Service...")


# Initialize FastAPI app
app = FastAPI(
    title="SnowGuard AI Service",
    description="AI-powered winter safety assistant",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - HEALTH FIRST (most important)
app.include_router(health.router, tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])


# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "SnowGuard AI Service",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "docs": "/docs"
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower()
    )