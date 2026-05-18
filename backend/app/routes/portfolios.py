from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import (
    PortfolioBase, PortfolioSummary, HoldingsResponse,
    PerformanceResponse, SectorAllocationResponse, AssetAllocationResponse,
    AttributionResponse, BenchmarkComparisonResponse, RiskMetricsResponse,
    PortfolioCreate, PortfolioUpdate, PortfolioRead,
    HoldingCreate, HoldingUpdate, HoldingRead,
)
from app.services import portfolio_service

try:
    from app.services import market_data as _market_data
    _fetch_latest_close = _market_data.fetch_latest_close
    _lookup_ticker = _market_data.lookup_ticker
    try:
        from app.services import refresh_service as _refresh_service
        def _refresh_fn(db: Session, security_id: int) -> None:
            from app.models import Security
            sec = db.query(Security).filter(Security.id == security_id).first()
            if sec:
                _refresh_service.refresh_all(db, portfolio_id=None, backfill_days=365)
    except Exception:
        _refresh_fn = None
except Exception:
    _fetch_latest_close = None
    _lookup_ticker = None
    _refresh_fn = None

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


# ---------------------------------------------------------------------------
# Portfolio CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=PortfolioRead, status_code=201)
def create_portfolio(payload: PortfolioCreate, db: Session = Depends(get_db)):
    return portfolio_service.create_portfolio(db, payload)


@router.put("/{portfolio_id}", response_model=PortfolioRead)
def update_portfolio(portfolio_id: int, payload: PortfolioUpdate, db: Session = Depends(get_db)):
    try:
        return portfolio_service.update_portfolio(db, portfolio_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{portfolio_id}", status_code=204)
def delete_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    try:
        portfolio_service.delete_portfolio(db, portfolio_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Holdings CRUD
# ---------------------------------------------------------------------------

@router.post("/{portfolio_id}/holdings", response_model=HoldingRead, status_code=201)
def add_holding(portfolio_id: int, payload: HoldingCreate, db: Session = Depends(get_db)):
    try:
        return portfolio_service.add_holding(
            db,
            portfolio_id,
            payload,
            fetch_latest_close_fn=_fetch_latest_close,
            lookup_fn=_lookup_ticker,
            refresh_fn=_refresh_fn,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{portfolio_id}/holdings/{security_id}", response_model=HoldingRead)
def update_holding(
    portfolio_id: int,
    security_id: int,
    payload: HoldingUpdate,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.update_holding(
            db,
            portfolio_id,
            security_id,
            payload,
            fetch_latest_close_fn=_fetch_latest_close,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{portfolio_id}/holdings/{security_id}", status_code=204)
def delete_holding(portfolio_id: int, security_id: int, db: Session = Depends(get_db)):
    try:
        portfolio_service.delete_holding(db, portfolio_id, security_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Existing read-only endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[PortfolioBase])
def list_portfolios(db: Session = Depends(get_db)):
    return portfolio_service.list_portfolios(db)


@router.get("/{portfolio_id}/summary", response_model=PortfolioSummary)
def get_summary(
    portfolio_id: int,
    period: Optional[str] = Query(None, pattern="^(1M|3M|6M|YTD|1Y|SI)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.get_portfolio_summary(db, portfolio_id, period, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{portfolio_id}/holdings", response_model=HoldingsResponse)
def get_holdings(
    portfolio_id: int,
    as_of_date: Optional[date] = None,
    sector: Optional[str] = None,
    asset_class: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.get_holdings(db, portfolio_id, as_of_date, sector, asset_class, search)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{portfolio_id}/performance", response_model=PerformanceResponse)
def get_performance(
    portfolio_id: int,
    period: Optional[str] = Query(None, pattern="^(1M|3M|6M|YTD|1Y|SI)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.get_performance(db, portfolio_id, period, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{portfolio_id}/sector-allocation", response_model=SectorAllocationResponse)
def get_sector_allocation(
    portfolio_id: int,
    as_of_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.get_sector_allocation(db, portfolio_id, as_of_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{portfolio_id}/asset-allocation", response_model=AssetAllocationResponse)
def get_asset_allocation(
    portfolio_id: int,
    as_of_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.get_asset_allocation(db, portfolio_id, as_of_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{portfolio_id}/attribution", response_model=AttributionResponse)
def get_attribution(
    portfolio_id: int,
    period: Optional[str] = Query(None, pattern="^(1M|3M|6M|YTD|1Y|SI)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.get_attribution(db, portfolio_id, period, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{portfolio_id}/benchmark-comparison", response_model=BenchmarkComparisonResponse)
def get_benchmark_comparison(
    portfolio_id: int,
    period: Optional[str] = Query(None, pattern="^(1M|3M|6M|YTD|1Y|SI)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.get_benchmark_comparison(db, portfolio_id, period, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{portfolio_id}/risk-metrics", response_model=RiskMetricsResponse)
def get_risk_metrics(
    portfolio_id: int,
    period: Optional[str] = Query(None, pattern="^(1M|3M|6M|YTD|1Y|SI)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        return portfolio_service.get_risk_metrics(db, portfolio_id, period, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
