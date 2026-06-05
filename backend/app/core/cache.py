import redis.asyncio as aioredis
from app.core.config import settings
from functools import lru_cache
import structlog
import json
from typing import Any, Optional

log = structlog.get_logger(__name__)


@lru_cache()
def get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)


class CacheService:
    def __init__(self):
        self.client = get_redis()
        self.default_ttl = settings.redis_ttl

    async def get(self, key: str) -> Optional[Any]:
        try:
            val = await self.client.get(key)
            return json.loads(val) if val else None
        except Exception as e:
            log.warning("cache.get_error", key=key, error=str(e))
            return None

    async def set(self, key: str, value: Any, ttl: int | None = None) -> bool:
        try:
            await self.client.setex(key, ttl or self.default_ttl, json.dumps(value, default=str))
            return True
        except Exception as e:
            log.warning("cache.set_error", key=key, error=str(e))
            return False

    async def delete(self, key: str) -> bool:
        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            log.warning("cache.delete_error", key=key, error=str(e))
            return False

    async def delete_pattern(self, pattern: str) -> int:
        try:
            keys = await self.client.keys(pattern)
            if keys:
                return await self.client.delete(*keys)
            return 0
        except Exception as e:
            log.warning("cache.delete_pattern_error", pattern=pattern, error=str(e))
            return 0

    async def exists(self, key: str) -> bool:
        try:
            return bool(await self.client.exists(key))
        except Exception:
            return False


cache = CacheService()
