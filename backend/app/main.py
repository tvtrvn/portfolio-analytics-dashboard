import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import text
from app.config import get_settings
from app.database import engine
from app.routes.portfolios import router as portfolios_router
from app.routes.securities import router as securities_router
from app.routes.benchmarks import router as benchmarks_router
from app.routes.admin import router as admin_router
from app.routes.health import router as health_router

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="Portfolio Analytics Dashboard API",
    description="Backend analytics API for institutional portfolio management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def cache_control_middleware(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    method = request.method
    # Apply Cache-Control only to GET 200 responses under /api/portfolios
    # but not to /admin or /health paths
    if (
        method == "GET"
        and response.status_code == 200
        and path.startswith("/api/portfolios")
        and not path.startswith("/api/admin")
        and not path.startswith("/api/health")
    ):
        response.headers["Cache-Control"] = "public, max-age=300"
    return response


app.include_router(portfolios_router, prefix="/api")
app.include_router(securities_router, prefix="/api")
app.include_router(benchmarks_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(health_router, prefix="/api")


@app.on_event("startup")
def ensure_unique_indexes() -> None:
    """Idempotent: add unique indexes the refresh service relies on for ON CONFLICT upserts.
    Safe to run on existing databases provided no duplicate rows exist."""
    statements = [
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_prices_security_date "
        "ON prices (security_id, date)",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_portfolio_returns_portfolio_date "
        "ON portfolio_returns (portfolio_id, date)",
    ]
    try:
        with engine.begin() as conn:
            for stmt in statements:
                conn.execute(text(stmt))
    except Exception as exc:
        logger.warning("ensure_unique_indexes failed (continuing): %s", exc)
