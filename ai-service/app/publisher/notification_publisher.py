# ai-service/app/publisher/notification_publisher.py

import redis
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class NotificationPublisher:
    def __init__(self, redis_host: str = "redis", redis_port: int = 6379):
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )
    
    def publish_ai_response(self, user_id: int, message: str, chat_id: str = None):
        try:
            event = {
                "userId": user_id,
                "message": message,
                "chatId": chat_id,
                "timestamp": int(time.time() * 1000)
            }
            
            self.redis_client.publish("ai:responses", json.dumps(event))
            logger.info(f"Published AI response notification for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to publish AI response: {e}")

# Add to config.py
publisher = NotificationPublisher(
    redis_host=os.getenv("REDIS_HOST", "redis"),
    redis_port=int(os.getenv("REDIS_PORT", 6379))
)

# Add to chat.py after AI response
from app.publisher.notification_publisher import publisher

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # ... existing code ...
    
    # After generating AI response
    if request.user_id:
        publisher.publish_ai_response(
            user_id=request.user_id,
            message="Your safety analysis is ready",
            chat_id=str(chat_log.id) if chat_log else None
        )
    
    return response