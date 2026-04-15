from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import (
    PortfolioBase, PortfolioSummary, HoldingsResponse,
    PerformanceResponse, SectorAllocationResponse, AssetAllocationResponse,
    AttributionResponse, BenchmarkComparisonResponse, RiskMetricsResponse,
)
from app.services import portfolio_service

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


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
