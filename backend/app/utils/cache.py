import time

# Global in-memory cache
# Format: { "key": {"data": "json_string", "expires_at": timestamp} }
in_memory_cache = {}

async def init_redis():
    # No-op for in-memory
    pass

async def close_redis():
    # No-op for in-memory
    pass

def get_redis():
    # Return our basic cache manager structure instead
    class DummyRedis:
        def get(self, key: str):
            item = in_memory_cache.get(key)
            if item:
                if time.time() < item["expires_at"]:
                    return item["data"]
                else:
                    del in_memory_cache[key] # Clean up expired
            return None
            
        def set(self, key: str, value: str, ex: int):
            in_memory_cache[key] = {
                "data": value,
                "expires_at": time.time() + ex
            }
            
    return DummyRedis()
