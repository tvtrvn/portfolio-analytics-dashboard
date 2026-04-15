from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes.portfolios import router as portfolios_router

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

app.include_router(portfolios_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "healthy"}
