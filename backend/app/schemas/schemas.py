from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional


class PortfolioBase(BaseModel):
    id: int
    name: str
    strategy: str
    currency: str
    inception_date: date
    description: Optional[str] = None
    benchmark_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PortfolioCreate(BaseModel):
    name: str
    strategy: str
    benchmark_id: Optional[int] = None
    inception_date: date
    currency: str = "CAD"
    description: Optional[str] = None


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    strategy: Optional[str] = None
    benchmark_id: Optional[int] = None
    inception_date: Optional[date] = None
    currency: Optional[str] = None
    description: Optional[str] = None


class PortfolioRead(BaseModel):
    id: int
    name: str
    strategy: str
    currency: str
    inception_date: date
    description: Optional[str] = None
    benchmark_id: Optional[int] = None
    benchmark_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SecurityCreate(BaseModel):
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None
    asset_class: Optional[str] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None


class SecurityRead(BaseModel):
    id: int
    ticker: str
    name: str
    sector: str
    asset_class: str
    currency: str
    exchange: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SecurityMetadata(BaseModel):
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None
    asset_class: Optional[str] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None


class HoldingCreate(BaseModel):
    ticker: str
    quantity: float
    cost_basis: Optional[float] = 0.0
    target_weight: Optional[float] = 0.0


class HoldingUpdate(BaseModel):
    quantity: Optional[float] = None
    cost_basis: Optional[float] = None
    target_weight: Optional[float] = None


class HoldingRead(BaseModel):
    id: int
    portfolio_id: int
    security_id: int
    date: date
    quantity: float
    market_value: float
    weight: float
    target_weight: Optional[float] = None
    cost_basis: Optional[float] = None
    ticker: Optional[str] = None
    name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RefreshRequest(BaseModel):
    portfolio_id: Optional[int] = None


class RefreshResult(BaseModel):
    updated_securities: int
    updated_returns_through: Optional[date] = None
    skipped: int
    errors: list[str]


class KeepaliveResponse(BaseModel):
    ok: bool
    db: str
    last_refresh: Optional[str] = None


class PortfolioSummary(BaseModel):
    portfolio: PortfolioBase
    total_market_value: float
    daily_return: float
    cumulative_return: float
    annualized_return: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    tracking_error: Optional[float] = None
    information_ratio: Optional[float] = None
    top_positions: list["HoldingItem"]
    as_of_date: date


class HoldingItem(BaseModel):
    id: Optional[int] = None
    security_id: Optional[int] = None
    ticker: str
    name: str
    sector: str
    asset_class: str
    weight: float
    market_value: float
    quantity: float
    target_weight: Optional[float] = None
    weight_drift: Optional[float] = None
    return_contribution: Optional[float] = None
    cost_basis: Optional[float] = None


class HoldingsResponse(BaseModel):
    portfolio_id: int
    as_of_date: date
    total_market_value: float
    holdings: list[HoldingItem]


class PerformancePoint(BaseModel):
    date: date
    portfolio_return: float
    benchmark_return: Optional[float] = None
    excess_return: Optional[float] = None


class PerformanceResponse(BaseModel):
    portfolio_id: int
    period: str
    start_date: date
    end_date: date
    cumulative_return: float
    annualized_return: float
    benchmark_cumulative_return: Optional[float] = None
    benchmark_annualized_return: Optional[float] = None
    excess_return: Optional[float] = None
    series: list[PerformancePoint]


class SectorAllocation(BaseModel):
    sector: str
    weight: float
    market_value: float
    benchmark_weight: Optional[float] = None


class SectorAllocationResponse(BaseModel):
    portfolio_id: int
    as_of_date: date
    allocations: list[SectorAllocation]


class AssetAllocation(BaseModel):
    asset_class: str
    weight: float
    market_value: float


class AssetAllocationResponse(BaseModel):
    portfolio_id: int
    as_of_date: date
    allocations: list[AssetAllocation]


class SecurityAttribution(BaseModel):
    ticker: str
    name: str
    sector: str
    weight: float
    return_contribution: float
    benchmark_weight: Optional[float] = None
    relative_contribution: Optional[float] = None


class SectorAttribution(BaseModel):
    sector: str
    portfolio_weight: float
    benchmark_weight: Optional[float] = None
    portfolio_contribution: float
    benchmark_contribution: Optional[float] = None
    allocation_effect: Optional[float] = None
    selection_effect: Optional[float] = None
    total_effect: Optional[float] = None


class AttributionResponse(BaseModel):
    portfolio_id: int
    period: str
    start_date: date
    end_date: date
    total_return: float
    benchmark_return: Optional[float] = None
    excess_return: Optional[float] = None
    by_security: list[SecurityAttribution]
    by_sector: list[SectorAttribution]
    best_contributors: list[SecurityAttribution]
    worst_contributors: list[SecurityAttribution]


class BenchmarkComparisonResponse(BaseModel):
    portfolio_id: int
    benchmark_name: str
    period: str
    portfolio_cumulative: float
    benchmark_cumulative: float
    excess_return: float
    tracking_error: float
    information_ratio: float
    series: list[PerformancePoint]


class RollingVolatilityPoint(BaseModel):
    date: date
    vol_30d: Optional[float] = None
    vol_90d: Optional[float] = None
    benchmark_vol_30d: Optional[float] = None
    benchmark_vol_90d: Optional[float] = None


class DrawdownPoint(BaseModel):
    date: date
    drawdown: float
    benchmark_drawdown: Optional[float] = None


class RiskMetricsResponse(BaseModel):
    portfolio_id: int
    period: str
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    max_drawdown_start: Optional[date] = None
    max_drawdown_end: Optional[date] = None
    var_95: float
    cvar_95: float
    beta: Optional[float] = None
    tracking_error: Optional[float] = None
    information_ratio: Optional[float] = None
    rolling_volatility: list[RollingVolatilityPoint]
    drawdown_series: list[DrawdownPoint]


class DateRangeParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    period: Optional[str] = Field(None, pattern="^(1M|3M|6M|YTD|1Y|SI)$")
