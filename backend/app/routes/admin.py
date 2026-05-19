from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import get_settings
from app.schemas.schemas import RefreshRequest, RefreshResult

try:
    from app.services import refresh_service as _refresh_service
    _refresh_all = _refresh_service.refresh_all
except Exception:
    _refresh_all = None

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/refresh-prices", response_model=RefreshResult)
def refresh_prices(
    payload: RefreshRequest,
    x_refresh_token: str = Header(..., alias="X-Refresh-Token"),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if x_refresh_token != settings.refresh_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if _refresh_all is None:
        raise HTTPException(status_code=503, detail="refresh_service unavailable")

    result = _refresh_all(db, portfolio_id=payload.portfolio_id, backfill_days=settings.backfill_days)

    return RefreshResult(
        updated_securities=result.get("updated_securities", 0),
        updated_benchmarks=result.get("updated_benchmarks", 0),
        updated_returns_through=result.get("updated_returns_through"),
        skipped=result.get("skipped", []),
        errors=result.get("errors", []),
    )


@router.post("/rebuild-from-yfinance", response_model=RefreshResult)
def rebuild_from_yfinance(
    x_refresh_token: str = Header(..., alias="X-Refresh-Token"),
    db: Session = Depends(get_db),
):
    """
    Destructive: wipe synthetic Price / PortfolioReturn / BenchmarkReturn rows
    and rebuild from yfinance for the full holdings history. Holdings, securities,
    portfolios, benchmarks, and transactions are preserved. Intended as a one-shot
    after seed data has been planted; subsequent updates use /refresh-prices.
    """
    settings = get_settings()
    if x_refresh_token != settings.refresh_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if _refresh_all is None:
        raise HTTPException(status_code=503, detail="refresh_service unavailable")

    # 1500 days ≈ 4 years — covers the seed inception date (2023-01-03).
    result = _refresh_all(db, force_rebuild=True, backfill_days=1500)

    return RefreshResult(
        updated_securities=result.get("updated_securities", 0),
        updated_benchmarks=result.get("updated_benchmarks", 0),
        updated_returns_through=result.get("updated_returns_through"),
        skipped=result.get("skipped", []),
        errors=result.get("errors", []),
    )
