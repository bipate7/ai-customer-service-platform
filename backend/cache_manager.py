# backend/cache_manager.py - Simple cache implementation
class SimpleCache:
    def __init__(self):
        self._cache = {}
    
    def get(self, key):
        return self._cache.get(key)
    
    def set(self, key, value, timeout=None):
        self._cache[key] = value
    
    def clear(self):
        self._cache.clear()
    
    def get_stats(self):
        return {"size": len(self._cache)}

cache_manager = SimpleCache()