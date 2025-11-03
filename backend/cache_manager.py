# backend/cache_manager.py
from flask_caching import Cache

# Initialize cache
cache_manager = Cache()

# Cache configuration
CACHE_CONFIG = {
    'CACHE_TYPE': 'simple',  # Use 'redis' or 'filesystem' in production
    'CACHE_DEFAULT_TIMEOUT': 300,  # 5 minutes
    'CACHE_THRESHOLD': 1000,  # Maximum number of items
    'CACHE_KEY_PREFIX': 'ai_chat_'
}

def init_cache(app):
    """Initialize cache with the Flask app"""
    cache_manager.init_app(app, config=CACHE_CONFIG)
    return cache_manager

def get_cache():
    """Get the cache instance"""
    return cache_manager

# Cache keys for different types of data
class CacheKeys:
    CHAT_RESPONSE = "chat_response_{session_id}_{message_hash}"
    KNOWLEDGE_BASE = "knowledge_base_{doc_id}"
    USER_SESSION = "user_session_{user_id}"
    API_RATE_LIMIT = "rate_limit_{ip}_{endpoint}"

# Utility functions
def cache_chat_response(session_id, message, response):
    """Cache chat response"""
    key = CacheKeys.CHAT_RESPONSE.format(
        session_id=session_id, 
        message_hash=hash(message)
    )
    cache_manager.set(key, response, timeout=600)  # 10 minutes
    return key

def get_cached_response(session_id, message):
    """Get cached chat response"""
    key = CacheKeys.CHAT_RESPONSE.format(
        session_id=session_id, 
        message_hash=hash(message)
    )
    return cache_manager.get(key)

def clear_user_cache(user_id):
    """Clear all cache for a specific user"""
    # This would need more sophisticated implementation for production
    # For simple cache, we can't easily clear by pattern
    pass