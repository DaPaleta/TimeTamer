from __future__ import annotations

import json
from typing import Optional
import redis

from .config import settings


_redis_client: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(settings.redis_url)
    return _redis_client


def cache_get_text(key: str) -> Optional[str]:
    try:
        val = get_redis().get(key)
        return val.decode("utf-8") if val else None
    except Exception:
        return None


def cache_set_text(key: str, value: str, ttl_seconds: int) -> None:
    try:
        get_redis().setex(key, ttl_seconds, value)
    except Exception:
        pass


