# ===== app/routes/chat.py =====
"""
Chat endpoint routes for AI interactions (with history)
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging
from datetime import datetime
from typing import List, Optional

from ..schemas import ChatRequest, ChatResponse, ChatHistoryResponse
from ..database import get_db, ChatLog
from ..services.ai_service import ai_service
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    AI chat endpoint for winter safety guidance using Gemini
    """
    try:
        logger.info(f"Chat request from user_id={request.user_id}: {request.message[:50]}...")
        
        # Validate message length
        if len(request.message) > settings.MAX_PROMPT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Message too long. Maximum {settings.MAX_PROMPT_LENGTH} characters allowed."
            )
        
        # Generate AI response using Gemini
        ai_result = await ai_service.generate_response(
            user_message=request.message,
            context=request.context
        )
        
        # Build response
        response = ChatResponse(
            reply=ai_result["reply"],
            confidence=ai_result.get("confidence"),
            suggestions=ai_result.get("suggestions"),
            warnings=ai_result.get("warnings"),
            metadata={
                "tokens_used": ai_result.get("tokens_used"),
                "model": ai_result.get("model"),
                "provider": "gemini"
            }
        )
        
        # Log chat to database if enabled
        if settings.ENABLE_CHAT_LOGGING:
            try:
                chat_log = ChatLog(
                    user_id=request.user_id,
                    prompt=request.message,
                    response=ai_result["reply"],
                    metadata={
                        "context": request.context.dict() if request.context else None,
                        "confidence": ai_result.get("confidence"),
                        "warnings": ai_result.get("warnings"),
                        "suggestions": ai_result.get("suggestions"),
                        "provider": "gemini"
                    },
                    model_used=ai_result.get("model", settings.GEMINI_MODEL),
                    tokens_used=ai_result.get("tokens_used")
                )
                db.add(chat_log)
                db.commit()
                db.refresh(chat_log)
                logger.info(f"Chat logged with id={chat_log.id}")
            except Exception as log_error:
                logger.error(f"Failed to log chat: {str(log_error)}")
                db.rollback()
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat request: {str(e)}"
        )


@router.get("/chat/history/{user_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    user_id: int,
    limit: int = Query(default=10, ge=1, le=100, description="Number of messages to return"),
    offset: int = Query(default=0, ge=0, description="Number of messages to skip"),
    db: Session = Depends(get_db)
):
    """
    Retrieve chat history for a user
    
    Args:
        user_id: User ID to get history for
        limit: Maximum number of messages (1-100, default: 10)
        offset: Number of messages to skip (for pagination)
    
    Returns:
        ChatHistoryResponse with user chats and pagination info
    """
    try:
        logger.info(f"Fetching chat history for user_id={user_id}, limit={limit}, offset={offset}")
        
        # Get total count
        total_count = db.query(ChatLog).filter(
            ChatLog.user_id == user_id
        ).count()
        
        # Get paginated chats
        chats = db.query(ChatLog).filter(
            ChatLog.user_id == user_id
        ).order_by(
            desc(ChatLog.created_at)
        ).offset(offset).limit(limit).all()
        
        # Format response
        chat_items = []
        for chat in chats:
            chat_items.append({
                "id": chat.id,
                "prompt": chat.prompt,
                "response": chat.response,
                "created_at": chat.created_at.isoformat(),
                "model_used": chat.model_used,
                "tokens_used": chat.tokens_used,
                "metadata": chat.metadata or {}
            })
        
        logger.info(f"Retrieved {len(chat_items)} chats for user {user_id}")
        
        return ChatHistoryResponse(
            user_id=user_id,
            total_count=total_count,
            count=len(chat_items),
            limit=limit,
            offset=offset,
            chats=chat_items
        )
        
    except Exception as e:
        logger.error(f"Failed to retrieve chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve chat history: {str(e)}"
        )


@router.delete("/chat/history/{user_id}")
async def delete_chat_history(
    user_id: int,
    chat_id: Optional[int] = Query(None, description="Specific chat ID to delete (omit to delete all)"),
    db: Session = Depends(get_db)
):
    """
    Delete chat history for a user
    
    Args:
        user_id: User ID
        chat_id: Optional specific chat ID to delete (deletes all if not provided)
    
    Returns:
        Success message with count of deleted records
    """
    try:
        if chat_id:
            # Delete specific chat
            chat = db.query(ChatLog).filter(
                ChatLog.id == chat_id,
                ChatLog.user_id == user_id
            ).first()
            
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found")
            
            db.delete(chat)
            db.commit()
            
            logger.info(f"Deleted chat {chat_id} for user {user_id}")
            return {"message": "Chat deleted successfully", "deleted_count": 1}
        else:
            # Delete all chats for user
            deleted_count = db.query(ChatLog).filter(
                ChatLog.user_id == user_id
            ).delete()
            db.commit()
            
            logger.info(f"Deleted {deleted_count} chats for user {user_id}")
            return {"message": f"Deleted all chats for user {user_id}", "deleted_count": deleted_count}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete chat history: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete chat history: {str(e)}"
        )
