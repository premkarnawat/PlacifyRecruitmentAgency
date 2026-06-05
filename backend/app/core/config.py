"""
VERIQO Backend Configuration
=============================
Phase 1.5 Update:
  - Removed Qdrant settings (replaced by pgvector inside Supabase)
  - Removed Resend settings (replaced by Supabase SMTP)
  - Added SMTP settings
  - Added pgvector / embedding settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── App ───────────────────────────────────────────────────
    app_name: str = "Veriqo API"
    app_env: str = "development"
    debug: bool = False
    secret_key: str = "changeme-at-least-32-chars-long!!"
    api_v1_prefix: str = "/api/v1"
    allowed_origins: str = "http://localhost:3000"

    # ── Supabase ─────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # ── SMTP (Supabase Auth SMTP or any provider) ────────────
    # Configure in Supabase Dashboard → Authentication → SMTP Settings
    # Or provide your own SMTP (SendGrid, Mailgun, Postmark, etc.)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@veriqo.io"
    smtp_from_name: str = "Veriqo"
    smtp_use_tls: bool = True

    # ── Groq ─────────────────────────────────────────────────
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    # Groq embedding model (text-embedding-3-small is OpenAI compatible)
    # Veriqo uses Groq for chat completions; embeddings via sentence-transformers
    # or a lightweight model hosted on Groq when available.
    embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = 1536

    # ── pgvector (inside Supabase) ────────────────────────────
    # No separate vector DB URL needed — uses Supabase PostgreSQL directly
    pgvector_min_similarity: float = 0.5   # minimum cosine similarity to surface
    pgvector_search_limit: int = 50        # max candidates returned per search

    # ── Redis ─────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379"
    redis_ttl: int = 3600

    # ── Razorpay ─────────────────────────────────────────────
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    # ── Sentry ───────────────────────────────────────────────
    sentry_dsn: str = ""

    # ── Rate Limiting ─────────────────────────────────────────
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000

    # ── Bulk Processing ───────────────────────────────────────
    bulk_batch_size: int = 50       # candidates processed per batch
    bulk_max_file_mb: int = 50      # max upload size in MB

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
