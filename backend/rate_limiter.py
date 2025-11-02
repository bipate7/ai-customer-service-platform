from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging

logger = logging.getLogger(__name__)

class RateLimitManager:
    def __init__(self, app):
        self.limiter = Limiter(
            get_remote_address,
            app=app,
            default_limits=["200 per day", "50 per hour"],
            storage_uri="memory://",
            strategy="fixed-window",
            on_breach=self.on_breach
        )
        
    def on_breach(self, request_limit):
        logger.warning(f"Rate limit breached: {request_limit}")
        
    def init_app(self, app):
        # Apply specific rate limits
        self.limiter.init_app(app)
        
    def get_limiter(self):
        return self.limiter

# Rate limit configurations
RATE_LIMITS = {
    'chat': "10 per minute",
    'upload': "5 per minute", 
    'search': "20 per minute",
    'auth': "5 per minute",
    'api': "100 per hour"
}