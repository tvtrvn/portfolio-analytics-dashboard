from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Security
from app.schemas.schemas import SecurityCreate, SecurityRead, SecurityMetadata
from app.services import portfolio_service

try:
    from app.services import market_data as _market_data
    _lookup_ticker = _market_data.lookup_ticker
    try:
        from app.services import refresh_service as _refresh_service
        def _refresh_fn(db: Session, security_id: int) -> None:
            _refresh_service.refresh_all(db, portfolio_id=None, backfill_days=365)
    except Exception:
        _refresh_fn = None
except Exception:
    _lookup_ticker = None
    _refresh_fn = None

router = APIRouter(prefix="/securities", tags=["securities"])


@router.get("", response_model=list[SecurityRead])
def list_securities(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Security)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Security.ticker.ilike(pattern)) | (Security.name.ilike(pattern))
        )
    return query.order_by(Security.ticker).all()


@router.get("/lookup", response_model=SecurityMetadata)
def lookup_security(
    ticker: str = Query(...),
    db: Session = Depends(get_db),
):
    if _lookup_ticker is None:
        raise HTTPException(status_code=503, detail="market_data service unavailable")
    meta = _lookup_ticker(ticker.upper())
    if not meta:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")
    return SecurityMetadata(
        ticker=meta.get("ticker", ticker.upper()),
        name=meta.get("name"),
        sector=meta.get("sector"),
        asset_class=meta.get("asset_class"),
        currency=meta.get("currency"),
        exchange=meta.get("exchange"),
    )


@router.post("", response_model=SecurityRead, status_code=201)
def create_security(payload: SecurityCreate, db: Session = Depends(get_db)):
    sec, created = portfolio_service.upsert_security_for_ticker(
        db,
        payload,
        lookup_fn=_lookup_ticker,
        refresh_fn=_refresh_fn,
    )
    # If already existed return 200 with the existing record
    from fastapi.responses import JSONResponse
    from fastapi.encoders import jsonable_encoder
    read = SecurityRead.model_validate(sec)
    if not created:
        return JSONResponse(status_code=200, content=jsonable_encoder(read))
    return sec
