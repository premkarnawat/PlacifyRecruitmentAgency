from supabase import create_client, Client
from app.core.config import settings
from functools import lru_cache
import structlog

log = structlog.get_logger(__name__)


@lru_cache()
def get_supabase() -> Client:
    """Return a cached Supabase admin client (service role)."""
    client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    log.info("supabase.connected", url=settings.supabase_url)
    return client


def get_supabase_anon() -> Client:
    """Return a Supabase client with anon key (respects RLS)."""
    return create_client(settings.supabase_url, settings.supabase_anon_key)
