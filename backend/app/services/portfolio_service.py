from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models import (
    Portfolio, Benchmark, Security, Holding,
    PortfolioReturn, BenchmarkReturn, Price,
)
from app.schemas.schemas import (
    PortfolioBase, PortfolioSummary, HoldingItem, HoldingsResponse,
    PerformancePoint, PerformanceResponse,
    SectorAllocation, SectorAllocationResponse,
    AssetAllocation, AssetAllocationResponse,
    SecurityAttribution, SectorAttribution, AttributionResponse,
    BenchmarkComparisonResponse,
    RollingVolatilityPoint, DrawdownPoint, RiskMetricsResponse,
)
from app.services import analytics
from app.config import get_settings


def resolve_date_range(
    inception_date: date,
    period: str | None,
    start_date: date | None,
    end_date: date | None,
) -> tuple[date, date]:
    """Convert a period code (1M, 3M, 6M, YTD, 1Y, SI) into concrete dates."""
    today = date.today()
    if end_date is None:
        end_date = today
    if period:
        match period:
            case "1M":
                start_date = end_date - relativedelta(months=1)
            case "3M":
                start_date = end_date - relativedelta(months=3)
            case "6M":
                start_date = end_date - relativedelta(months=6)
            case "YTD":
                start_date = date(end_date.year, 1, 1)
            case "1Y":
                start_date = end_date - relativedelta(years=1)
            case "SI":
                start_date = inception_date
    if start_date is None:
        start_date = inception_date
    return max(start_date, inception_date), end_date


def list_portfolios(db: Session) -> list[PortfolioBase]:
    portfolios = db.query(Portfolio).all()
    result = []
    for p in portfolios:
        result.append(PortfolioBase(
            id=p.id,
            name=p.name,
            strategy=p.strategy,
            currency=p.currency,
            inception_date=p.inception_date,
            description=p.description,
            benchmark_name=p.benchmark.name if p.benchmark else None,
        ))
    return result


def get_portfolio_summary(
    db: Session, portfolio_id: int,
    period: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> PortfolioSummary:
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    s, e = resolve_date_range(portfolio.inception_date, period, start_date, end_date)

    p_returns = (
        db.query(PortfolioReturn)
        .filter(PortfolioReturn.portfolio_id == portfolio_id)
        .filter(PortfolioReturn.date >= s, PortfolioReturn.date <= e)
        .order_by(PortfolioReturn.date)
        .all()
    )

    daily_rets = [float(r.daily_return) for r in p_returns]

    latest_return = p_returns[-1] if p_returns else None
    as_of = latest_return.date if latest_return else e
    total_mv = float(latest_return.market_value) if latest_return else 0.0

    cum_ret = analytics.cumulative_return(daily_rets)
    ann_ret = analytics.annualized_return(cum_ret, len(daily_rets))
    vol = analytics.annualized_volatility(daily_rets)
    settings = get_settings()
    sr = analytics.sharpe_ratio(daily_rets, settings.risk_free_rate)
    mdd, _, _ = analytics.max_drawdown(daily_rets)

    daily_ret_today = daily_rets[-1] if daily_rets else 0.0

    b_rets_list: list[float] = []
    te = ir = None
    if portfolio.benchmark_id:
        b_returns = (
            db.query(BenchmarkReturn)
            .filter(BenchmarkReturn.benchmark_id == portfolio.benchmark_id)
            .filter(BenchmarkReturn.date >= s, BenchmarkReturn.date <= e)
            .order_by(BenchmarkReturn.date)
            .all()
        )
        b_rets_list = [float(r.daily_return) for r in b_returns]
        min_len = min(len(daily_rets), len(b_rets_list))
        if min_len > 1:
            te = analytics.tracking_error(daily_rets[:min_len], b_rets_list[:min_len])
            ir = analytics.information_ratio(daily_rets[:min_len], b_rets_list[:min_len])

    latest_holdings = (
        db.query(Holding)
        .join(Security)
        .filter(Holding.portfolio_id == portfolio_id)
        .filter(Holding.date == as_of)
        .order_by(desc(Holding.market_value))
        .limit(5)
        .all()
    )

    top_positions = [
        HoldingItem(
            ticker=h.security.ticker,
            name=h.security.name,
            sector=h.security.sector,
            asset_class=h.security.asset_class,
            weight=float(h.weight),
            market_value=float(h.market_value),
            quantity=float(h.quantity),
            target_weight=float(h.target_weight) if h.target_weight else None,
        )
        for h in latest_holdings
    ]

    portfolio_base = PortfolioBase(
        id=portfolio.id,
        name=portfolio.name,
        strategy=portfolio.strategy,
        currency=portfolio.currency,
        inception_date=portfolio.inception_date,
        description=portfolio.description,
        benchmark_name=portfolio.benchmark.name if portfolio.benchmark else None,
    )

    return PortfolioSummary(
        portfolio=portfolio_base,
        total_market_value=total_mv,
        daily_return=daily_ret_today,
        cumulative_return=cum_ret,
        annualized_return=ann_ret,
        volatility=vol,
        sharpe_ratio=sr,
        max_drawdown=mdd,
        tracking_error=te,
        information_ratio=ir,
        top_positions=top_positions,
        as_of_date=as_of,
    )


def get_holdings(
    db: Session, portfolio_id: int,
    as_of_date: date | None = None,
    sector: str | None = None,
    asset_class: str | None = None,
    search: str | None = None,
) -> HoldingsResponse:
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    if as_of_date is None:
        latest = (
            db.query(func.max(Holding.date))
            .filter(Holding.portfolio_id == portfolio_id)
            .scalar()
        )
        as_of_date = latest or date.today()

    query = (
        db.query(Holding)
        .join(Security)
        .filter(Holding.portfolio_id == portfolio_id)
        .filter(Holding.date == as_of_date)
    )
    if sector:
        query = query.filter(Security.sector == sector)
    if asset_class:
        query = query.filter(Security.asset_class == asset_class)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Security.ticker.ilike(pattern)) | (Security.name.ilike(pattern))
        )

    holdings = query.order_by(desc(Holding.market_value)).all()

    total_mv = sum(float(h.market_value) for h in holdings)

    items = []
    for h in holdings:
        drift = None
        if h.target_weight is not None:
            drift = float(h.weight) - float(h.target_weight)
        items.append(HoldingItem(
            ticker=h.security.ticker,
            name=h.security.name,
            sector=h.security.sector,
            asset_class=h.security.asset_class,
            weight=float(h.weight),
            market_value=float(h.market_value),
            quantity=float(h.quantity),
            target_weight=float(h.target_weight) if h.target_weight else None,
            weight_drift=drift,
            cost_basis=float(h.cost_basis) if h.cost_basis else None,
        ))

    return HoldingsResponse(
        portfolio_id=portfolio_id,
        as_of_date=as_of_date,
        total_market_value=total_mv,
        holdings=items,
    )


def get_performance(
    db: Session, portfolio_id: int,
    period: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> PerformanceResponse:
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    s, e = resolve_date_range(portfolio.inception_date, period, start_date, end_date)

    p_returns = (
        db.query(PortfolioReturn)
        .filter(PortfolioReturn.portfolio_id == portfolio_id)
        .filter(PortfolioReturn.date >= s, PortfolioReturn.date <= e)
        .order_by(PortfolioReturn.date)
        .all()
    )

    b_returns_map: dict[date, float] = {}
    if portfolio.benchmark_id:
        b_rows = (
            db.query(BenchmarkReturn)
            .filter(BenchmarkReturn.benchmark_id == portfolio.benchmark_id)
            .filter(BenchmarkReturn.date >= s, BenchmarkReturn.date <= e)
            .order_by(BenchmarkReturn.date)
            .all()
        )
        b_cum = 0.0
        for br in b_rows:
            b_cum = (1 + b_cum) * (1 + float(br.daily_return)) - 1
            b_returns_map[br.date] = b_cum

    series = []
    p_cum = 0.0
    for pr in p_returns:
        p_cum = (1 + p_cum) * (1 + float(pr.daily_return)) - 1
        b_val = b_returns_map.get(pr.date)
        series.append(PerformancePoint(
            date=pr.date,
            portfolio_return=p_cum,
            benchmark_return=b_val,
            excess_return=(p_cum - b_val) if b_val is not None else None,
        ))

    daily_rets = [float(r.daily_return) for r in p_returns]
    cum_ret = analytics.cumulative_return(daily_rets)
    ann_ret = analytics.annualized_return(cum_ret, len(daily_rets))

    b_daily = [float(r.daily_return) for r in (b_rows if portfolio.benchmark_id else [])] if portfolio.benchmark_id else []
    b_cum_total = analytics.cumulative_return(b_daily) if b_daily else None
    b_ann = analytics.annualized_return(b_cum_total, len(b_daily)) if b_cum_total is not None else None

    return PerformanceResponse(
        portfolio_id=portfolio_id,
        period=period or "custom",
        start_date=s,
        end_date=e,
        cumulative_return=cum_ret,
        annualized_return=ann_ret,
        benchmark_cumulative_return=b_cum_total,
        benchmark_annualized_return=b_ann,
        excess_return=(cum_ret - b_cum_total) if b_cum_total is not None else None,
        series=series,
    )


def get_sector_allocation(
    db: Session, portfolio_id: int, as_of_date: date | None = None
) -> SectorAllocationResponse:
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    if as_of_date is None:
        as_of_date = (
            db.query(func.max(Holding.date))
            .filter(Holding.portfolio_id == portfolio_id)
            .scalar()
        ) or date.today()

    rows = (
        db.query(
            Security.sector,
            func.sum(Holding.weight).label("total_weight"),
            func.sum(Holding.market_value).label("total_mv"),
        )
        .join(Security, Holding.security_id == Security.id)
        .filter(Holding.portfolio_id == portfolio_id, Holding.date == as_of_date)
        .group_by(Security.sector)
        .all()
    )

    allocations = [
        SectorAllocation(
            sector=r.sector,
            weight=float(r.total_weight),
            market_value=float(r.total_mv),
        )
        for r in rows
    ]

    return SectorAllocationResponse(
        portfolio_id=portfolio_id,
        as_of_date=as_of_date,
        allocations=allocations,
    )


def get_asset_allocation(
    db: Session, portfolio_id: int, as_of_date: date | None = None
) -> AssetAllocationResponse:
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    if as_of_date is None:
        as_of_date = (
            db.query(func.max(Holding.date))
            .filter(Holding.portfolio_id == portfolio_id)
            .scalar()
        ) or date.today()

    rows = (
        db.query(
            Security.asset_class,
            func.sum(Holding.weight).label("total_weight"),
            func.sum(Holding.market_value).label("total_mv"),
        )
        .join(Security, Holding.security_id == Security.id)
        .filter(Holding.portfolio_id == portfolio_id, Holding.date == as_of_date)
        .group_by(Security.asset_class)
        .all()
    )

    allocations = [
        AssetAllocation(
            asset_class=r.asset_class,
            weight=float(r.total_weight),
            market_value=float(r.total_mv),
        )
        for r in rows
    ]

    return AssetAllocationResponse(
        portfolio_id=portfolio_id,
        as_of_date=as_of_date,
        allocations=allocations,
    )


def get_attribution(
    db: Session, portfolio_id: int,
    period: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> AttributionResponse:
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    s, e = resolve_date_range(portfolio.inception_date, period, start_date, end_date)

    holdings_start = (
        db.query(Holding).join(Security)
        .filter(Holding.portfolio_id == portfolio_id, Holding.date == s)
        .all()
    )
    holdings_end = (
        db.query(Holding).join(Security)
        .filter(Holding.portfolio_id == portfolio_id, Holding.date == e)
        .all()
    )

    if not holdings_end:
        latest_date = (
            db.query(func.max(Holding.date))
            .filter(Holding.portfolio_id == portfolio_id, Holding.date <= e)
            .scalar()
        )
        if latest_date:
            holdings_end = (
                db.query(Holding).join(Security)
                .filter(Holding.portfolio_id == portfolio_id, Holding.date == latest_date)
                .all()
            )

    sec_map: dict[int, dict] = {}
    for h in holdings_end:
        sec_id = h.security_id
        start_price_row = (
            db.query(Price)
            .filter(Price.security_id == sec_id, Price.date >= s)
            .order_by(Price.date)
            .first()
        )
        end_price_row = (
            db.query(Price)
            .filter(Price.security_id == sec_id, Price.date <= e)
            .order_by(desc(Price.date))
            .first()
        )

        sec_return = 0.0
        if start_price_row and end_price_row and float(start_price_row.close_price) > 0:
            sec_return = (
                float(end_price_row.close_price) / float(start_price_row.close_price) - 1
            )

        weight = float(h.weight)
        contribution = weight * sec_return

        sec_map[sec_id] = {
            "ticker": h.security.ticker,
            "name": h.security.name,
            "sector": h.security.sector,
            "weight": weight,
            "return": sec_return,
            "contribution": contribution,
        }

    by_security = [
        SecurityAttribution(
            ticker=v["ticker"],
            name=v["name"],
            sector=v["sector"],
            weight=v["weight"],
            return_contribution=v["contribution"],
        )
        for v in sec_map.values()
    ]
    by_security.sort(key=lambda x: x.return_contribution, reverse=True)

    sector_groups: dict[str, dict] = {}
    for v in sec_map.values():
        sec = v["sector"]
        if sec not in sector_groups:
            sector_groups[sec] = {"weight": 0.0, "contribution": 0.0}
        sector_groups[sec]["weight"] += v["weight"]
        sector_groups[sec]["contribution"] += v["contribution"]

    by_sector = [
        SectorAttribution(
            sector=k,
            portfolio_weight=v["weight"],
            portfolio_contribution=v["contribution"],
        )
        for k, v in sector_groups.items()
    ]
    by_sector.sort(key=lambda x: x.portfolio_contribution, reverse=True)

    total_ret = sum(v["contribution"] for v in sec_map.values())
    best = sorted(by_security, key=lambda x: x.return_contribution, reverse=True)[:5]
    worst = sorted(by_security, key=lambda x: x.return_contribution)[:5]

    return AttributionResponse(
        portfolio_id=portfolio_id,
        period=period or "custom",
        start_date=s,
        end_date=e,
        total_return=total_ret,
        by_security=by_security,
        by_sector=by_sector,
        best_contributors=best,
        worst_contributors=worst,
    )


def get_benchmark_comparison(
    db: Session, portfolio_id: int,
    period: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> BenchmarkComparisonResponse:
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")
    if not portfolio.benchmark_id:
        raise ValueError("Portfolio has no benchmark assigned")

    s, e = resolve_date_range(portfolio.inception_date, period, start_date, end_date)

    p_returns = (
        db.query(PortfolioReturn)
        .filter(PortfolioReturn.portfolio_id == portfolio_id)
        .filter(PortfolioReturn.date >= s, PortfolioReturn.date <= e)
        .order_by(PortfolioReturn.date)
        .all()
    )
    b_returns = (
        db.query(BenchmarkReturn)
        .filter(BenchmarkReturn.benchmark_id == portfolio.benchmark_id)
        .filter(BenchmarkReturn.date >= s, BenchmarkReturn.date <= e)
        .order_by(BenchmarkReturn.date)
        .all()
    )

    p_daily = [float(r.daily_return) for r in p_returns]
    b_daily = [float(r.daily_return) for r in b_returns]

    p_cum = analytics.cumulative_return(p_daily)
    b_cum = analytics.cumulative_return(b_daily)

    min_len = min(len(p_daily), len(b_daily))
    te = analytics.tracking_error(p_daily[:min_len], b_daily[:min_len])
    ir = analytics.information_ratio(p_daily[:min_len], b_daily[:min_len])

    b_map: dict[date, float] = {}
    running = 0.0
    for br in b_returns:
        running = (1 + running) * (1 + float(br.daily_return)) - 1
        b_map[br.date] = running

    series = []
    p_running = 0.0
    for pr in p_returns:
        p_running = (1 + p_running) * (1 + float(pr.daily_return)) - 1
        bv = b_map.get(pr.date)
        series.append(PerformancePoint(
            date=pr.date,
            portfolio_return=p_running,
            benchmark_return=bv,
            excess_return=(p_running - bv) if bv is not None else None,
        ))

    return BenchmarkComparisonResponse(
        portfolio_id=portfolio_id,
        benchmark_name=portfolio.benchmark.name,
        period=period or "custom",
        portfolio_cumulative=p_cum,
        benchmark_cumulative=b_cum,
        excess_return=p_cum - b_cum,
        tracking_error=te,
        information_ratio=ir,
        series=series,
    )


def get_risk_metrics(
    db: Session, portfolio_id: int,
    period: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> RiskMetricsResponse:
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    s, e = resolve_date_range(portfolio.inception_date, period, start_date, end_date)

    p_returns = (
        db.query(PortfolioReturn)
        .filter(PortfolioReturn.portfolio_id == portfolio_id)
        .filter(PortfolioReturn.date >= s, PortfolioReturn.date <= e)
        .order_by(PortfolioReturn.date)
        .all()
    )

    daily_rets = [float(r.daily_return) for r in p_returns]
    dates = [r.date for r in p_returns]
    settings = get_settings()

    vol = analytics.annualized_volatility(daily_rets)
    sr = analytics.sharpe_ratio(daily_rets, settings.risk_free_rate)
    mdd, peak_idx, trough_idx = analytics.max_drawdown(daily_rets)

    mdd_start = dates[peak_idx] if dates and peak_idx < len(dates) else None
    mdd_end = dates[trough_idx] if dates and trough_idx < len(dates) else None

    var95 = analytics.value_at_risk(daily_rets, 0.95)
    cvar95 = analytics.conditional_var(daily_rets, 0.95)

    roll_30 = analytics.rolling_volatility(daily_rets, 30)
    roll_90 = analytics.rolling_volatility(daily_rets, 90)
    dd_series = analytics.drawdown_series(daily_rets)

    b_beta = te = ir = None
    b_roll_30: list[float | None] = [None] * len(daily_rets)
    b_roll_90: list[float | None] = [None] * len(daily_rets)
    b_dd_series: list[float] = []
    if portfolio.benchmark_id:
        b_returns = (
            db.query(BenchmarkReturn)
            .filter(BenchmarkReturn.benchmark_id == portfolio.benchmark_id)
            .filter(BenchmarkReturn.date >= s, BenchmarkReturn.date <= e)
            .order_by(BenchmarkReturn.date)
            .all()
        )
        b_daily = [float(r.daily_return) for r in b_returns]
        min_len = min(len(daily_rets), len(b_daily))
        if min_len > 1:
            b_beta = analytics.beta(daily_rets[:min_len], b_daily[:min_len])
            te = analytics.tracking_error(daily_rets[:min_len], b_daily[:min_len])
            ir = analytics.information_ratio(daily_rets[:min_len], b_daily[:min_len])
        b_roll_30 = analytics.rolling_volatility(b_daily, 30)
        b_roll_90 = analytics.rolling_volatility(b_daily, 90)
        b_dd_series = analytics.drawdown_series(b_daily)

    rolling_vol = []
    for i, d in enumerate(dates):
        rolling_vol.append(RollingVolatilityPoint(
            date=d,
            vol_30d=roll_30[i],
            vol_90d=roll_90[i],
            benchmark_vol_30d=b_roll_30[i] if i < len(b_roll_30) else None,
            benchmark_vol_90d=b_roll_90[i] if i < len(b_roll_90) else None,
        ))

    dd_points = []
    for i, d in enumerate(dates):
        dd_points.append(DrawdownPoint(
            date=d,
            drawdown=dd_series[i] if i < len(dd_series) else 0.0,
            benchmark_drawdown=b_dd_series[i] if i < len(b_dd_series) else None,
        ))

    return RiskMetricsResponse(
        portfolio_id=portfolio_id,
        period=period or "custom",
        volatility=vol,
        sharpe_ratio=sr,
        max_drawdown=mdd,
        max_drawdown_start=mdd_start,
        max_drawdown_end=mdd_end,
        var_95=var95,
        cvar_95=cvar95,
        beta=b_beta,
        tracking_error=te,
        information_ratio=ir,
        rolling_volatility=rolling_vol,
        drawdown_series=dd_points,
    )
