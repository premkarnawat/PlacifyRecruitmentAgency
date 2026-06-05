"""
VERIQO Backend API
==================
Production-grade FastAPI application for the Veriqo
Verified Hiring Intelligence Platform.
"""
import time
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api.v1.router import api_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if not settings.is_production else structlog.processors.JSONRenderer(),
    ]
)

log = structlog.get_logger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    log.info("veriqo.starting", env=settings.app_env, debug=settings.debug)

    # Optionally initialise Sentry
    if settings.sentry_dsn and settings.is_production:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        sentry_sdk.init(dsn=settings.sentry_dsn, integrations=[FastApiIntegration()])
        log.info("sentry.initialised")

    log.info("veriqo.ready")
    yield
    log.info("veriqo.shutdown")


app = FastAPI(
    title="Veriqo API",
    description="Verified Hiring Intelligence Platform — Backend API",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

if settings.is_production:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["api.veriqo.io", "veriqo.io"])


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    """Add request ID, timing, and structured logging to every request."""
    import uuid
    request_id = str(uuid.uuid4())[:8]
    start_time = time.perf_counter()

    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
    )

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["X-Request-ID"]   = request_id
    response.headers["X-Process-Time"] = str(duration_ms)

    log.info(
        "http.request",
        status_code=response.status_code,
        duration_ms=duration_ms,
    )
    return response


# ── Exception handlers ────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"field": ".".join(str(l) for l in e["loc"]), "message": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": "Validation error", "errors": errors},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "An unexpected error occurred"},
    )


# ── Routes ────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name":    settings.app_name,
        "version": "1.0.0",
        "status":  "operational",
        "env":     settings.app_env,
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint for Railway/load balancer."""
    checks = {"api": "ok"}

    # Check Redis
    try:
        from app.core.cache import cache
        await cache.set("health:ping", "pong", ttl=10)
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "unavailable"

    # Check Supabase
    try:
        from app.core.database import get_supabase
        db = get_supabase()
        db.table("candidate_profiles").select("id").limit(1).execute()
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "unavailable"

    all_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=200 if all_ok else 503,
        content={"status": "healthy" if all_ok else "degraded", "checks": checks},
    )
