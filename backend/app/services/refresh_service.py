"""
refresh_service.py — Idempotent daily price + portfolio-return refresh.

Callable from:
  - CLI: backend/refresh_prices.py
  - HTTP route (Agent B will wire this in)

Key design decisions:
  - Missing prices on weekends/holidays: carry the last known close forward
    when computing market value for a given date. This is standard NAV
    accounting practice — the portfolio value doesn't change on non-trading days.
  - ON CONFLICT DO NOTHING for prices: pure idempotency — a second run on
    the same day is a no-op for the prices table.
  - ON CONFLICT DO UPDATE for portfolio_returns: re-stamps market_value /
    daily_return / cumulative_return so values stay accurate after late prices.
  - Per-security errors are caught and accumulated; they never abort the run.
  - Last-refresh timestamp is written to backend/.last_refresh (ISO string)
    for the keepalive endpoint to read.
"""

import logging
import os
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import select, func, text, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.models import (
    Security, Price, Portfolio, Holding, PortfolioReturn,
    Benchmark, BenchmarkReturn,
)
from app.services import market_data

logger = logging.getLogger(__name__)

# Path relative to this file: backend/app/services/ -> backend/.last_refresh
_LAST_REFRESH_PATH = os.path.join(
    os.path.dirname(__file__),  # backend/app/services
    "..", "..",                  # backend/
    ".last_refresh",
)
_LAST_REFRESH_PATH = os.path.normpath(_LAST_REFRESH_PATH)


def _write_last_refresh(dt: date) -> None:
    try:
        with open(_LAST_REFRESH_PATH, "w") as f:
            f.write(dt.isoformat())
    except Exception as exc:
        logger.warning("Could not write .last_refresh: %s", exc)


def _get_securities(session: Session, portfolio_id: Optional[int]) -> list[Security]:
    """Return securities to refresh — scoped to portfolio or all."""
    if portfolio_id is not None:
        # securities held by this portfolio (any snapshot)
        subq = (
            select(Holding.security_id)
            .where(Holding.portfolio_id == portfolio_id)
            .distinct()
            .scalar_subquery()
        )
        stmt = select(Security).where(Security.id.in_(subq))
    else:
        stmt = select(Security)
    return list(session.scalars(stmt).all())


def _get_max_price_date(session: Session, security_id: int) -> Optional[date]:
    stmt = select(func.max(Price.date)).where(Price.security_id == security_id)
    return session.scalar(stmt)


def _upsert_prices(session: Session, security_id: int, rows: list[tuple[date, float]]) -> int:
    """
    Bulk-upsert price rows. ON CONFLICT DO NOTHING — safe to re-run.
    Returns number of rows processed (not necessarily inserted).
    """
    if not rows:
        return 0

    values = [
        {"security_id": security_id, "date": d, "close_price": Decimal(str(round(c, 4)))}
        for d, c in rows
    ]

    stmt = pg_insert(Price).values(values)
    stmt = stmt.on_conflict_do_nothing(index_elements=["security_id", "date"])
    session.execute(stmt)
    return len(values)


def _get_portfolios(session: Session, portfolio_id: Optional[int]) -> list[Portfolio]:
    if portfolio_id is not None:
        stmt = select(Portfolio).where(Portfolio.id == portfolio_id)
    else:
        stmt = select(Portfolio)
    return list(session.scalars(stmt).all())


def _get_latest_holdings_date(session: Session, portfolio_id: int) -> Optional[date]:
    stmt = select(func.max(Holding.date)).where(Holding.portfolio_id == portfolio_id)
    return session.scalar(stmt)


def _get_holdings_snapshot(session: Session, portfolio_id: int, snap_date: date) -> list[Holding]:
    """Load all holdings for a portfolio on a specific snapshot date."""
    stmt = (
        select(Holding)
        .where(Holding.portfolio_id == portfolio_id, Holding.date == snap_date)
    )
    return list(session.scalars(stmt).all())


def _get_all_holdings_snapshots(
    session: Session, portfolio_id: int
) -> dict[date, dict[int, float]]:
    """
    Return {snapshot_date: {security_id: quantity}} for every holdings snapshot.
    Used to walk historical positions when recomputing returns from inception.
    """
    stmt = (
        select(Holding.date, Holding.security_id, Holding.quantity)
        .where(Holding.portfolio_id == portfolio_id)
        .order_by(Holding.date)
    )
    snapshots: dict[date, dict[int, float]] = {}
    for row in session.execute(stmt):
        snapshots.setdefault(row.date, {})[row.security_id] = float(row.quantity)
    return snapshots


def _holdings_as_of(
    snapshot_dates: list[date],
    snapshots: dict[date, dict[int, float]],
    d: date,
) -> dict[int, float]:
    """Return holdings on the most recent snapshot ≤ d, or {} if none exist."""
    chosen: Optional[date] = None
    for sd in snapshot_dates:
        if sd <= d:
            chosen = sd
        else:
            break
    return snapshots.get(chosen, {}) if chosen else {}


def _get_price_series(
    session: Session,
    security_ids: list[int],
    start: date,
    end: date,
) -> dict[int, dict[date, float]]:
    """
    Load prices for multiple securities over [start, end] from DB.
    Returns {security_id: {date: close_price}}.
    """
    stmt = (
        select(Price.security_id, Price.date, Price.close_price)
        .where(
            Price.security_id.in_(security_ids),
            Price.date >= start,
            Price.date <= end,
        )
        .order_by(Price.security_id, Price.date)
    )
    result: dict[int, dict[date, float]] = {sid: {} for sid in security_ids}
    for row in session.execute(stmt):
        result[row.security_id][row.date] = float(row.close_price)
    return result


def _carry_forward(price_map: dict[date, float], d: date) -> Optional[float]:
    """
    Return price on date d, or carry forward from the most recent prior date.
    Returns None if no price exists at all up to d.
    """
    if d in price_map:
        return price_map[d]
    # Find latest date <= d
    candidates = [k for k in price_map if k <= d]
    if not candidates:
        return None
    return price_map[max(candidates)]


def _generate_trading_dates(start: date, end: date) -> list[date]:
    """Return Mon-Fri dates between start and end inclusive (no holiday calendar)."""
    days = []
    cur = start
    while cur <= end:
        if cur.weekday() < 5:
            days.append(cur)
        cur += timedelta(days=1)
    return days


def _recompute_portfolio_returns(
    session: Session,
    portfolio: Portfolio,
    errors: list[str],
) -> None:
    """
    Recompute portfolio_returns using historical holdings snapshots and real prices.

    Walks every trading day from either (a) the day after the latest existing
    portfolio_return row, or (b) the earliest holdings snapshot when no rows
    exist (full rebuild). For each day, uses carry-forward holdings (most recent
    snapshot ≤ that day) and carry-forward prices.
    """
    today = date.today()
    snapshots = _get_all_holdings_snapshots(session, portfolio.id)
    if not snapshots:
        logger.warning("Portfolio %d has no holdings snapshot; skipping return recompute", portfolio.id)
        return

    snapshot_dates = sorted(snapshots.keys())
    earliest_snap = snapshot_dates[0]
    latest_snap = snapshot_dates[-1]

    # Union of all security_ids that ever appeared in this portfolio's holdings
    security_ids = sorted({sid for snap in snapshots.values() for sid in snap})

    last_ret_date_stmt = select(func.max(PortfolioReturn.date)).where(
        PortfolioReturn.portfolio_id == portfolio.id
    )
    last_ret_date: Optional[date] = session.scalar(last_ret_date_stmt)

    anchor_cum_ret: float = 0.0
    if last_ret_date:
        anchor_stmt = select(PortfolioReturn.cumulative_return).where(
            PortfolioReturn.portfolio_id == portfolio.id,
            PortfolioReturn.date == last_ret_date,
        )
        anchor_val = session.scalar(anchor_stmt)
        if anchor_val is not None:
            anchor_cum_ret = float(anchor_val)

    fill_start = (last_ret_date + timedelta(days=1)) if last_ret_date else earliest_snap
    trading_days = _generate_trading_dates(fill_start, today)
    if not trading_days:
        return

    price_start = min(earliest_snap, fill_start) - timedelta(days=7)
    prices_by_sec = _get_price_series(session, security_ids, price_start, today)

    cum_ret = anchor_cum_ret
    prev_day = fill_start - timedelta(days=1)
    prev_holdings = _holdings_as_of(snapshot_dates, snapshots, prev_day)
    prev_mv_calc = 0.0
    for sid, qty in prev_holdings.items():
        p = _carry_forward(prices_by_sec.get(sid, {}), prev_day)
        if p:
            prev_mv_calc += qty * p
    prev_mv: Optional[float] = prev_mv_calc if prev_mv_calc > 0 else None

    upsert_rows: list[dict] = []
    for d in trading_days:
        active = _holdings_as_of(snapshot_dates, snapshots, d)
        mv = 0.0
        for sid, qty in active.items():
            p = _carry_forward(prices_by_sec.get(sid, {}), d)
            if p is None:
                p = _carry_forward(prices_by_sec.get(sid, {}), latest_snap) or 0.0
            mv += qty * p

        if prev_mv and prev_mv > 0:
            daily_ret = (mv - prev_mv) / prev_mv
        else:
            daily_ret = 0.0

        cum_ret = (1 + cum_ret) * (1 + daily_ret) - 1
        prev_mv = mv

        upsert_rows.append({
            "portfolio_id": portfolio.id,
            "date": d,
            "daily_return": round(daily_ret, 8),
            "cumulative_return": round(cum_ret, 8),
            "market_value": round(mv, 2),
        })

    if upsert_rows:
        stmt = pg_insert(PortfolioReturn).values(upsert_rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["portfolio_id", "date"],
            set_={
                "daily_return": stmt.excluded.daily_return,
                "cumulative_return": stmt.excluded.cumulative_return,
                "market_value": stmt.excluded.market_value,
            },
        )
        session.execute(stmt)
        logger.info(
            "Upserted %d portfolio_return rows for portfolio %d",
            len(upsert_rows), portfolio.id,
        )


def _restamp_latest_holdings(
    session: Session,
    portfolio: Portfolio,
) -> None:
    """
    Update market_value and weight for the most recent holdings snapshot
    using the latest available prices. Quantity is unchanged.
    """
    snap_date = _get_latest_holdings_date(session, portfolio.id)
    if snap_date is None:
        return

    holdings = _get_holdings_snapshot(session, portfolio.id, snap_date)
    if not holdings:
        return

    today = date.today()
    security_ids = [h.security_id for h in holdings]
    prices_by_sec = _get_price_series(session, security_ids, today - timedelta(days=7), today)

    # Compute latest price per security (carry-forward from today)
    latest_prices: dict[int, float] = {}
    for sid in security_ids:
        p = _carry_forward(prices_by_sec.get(sid, {}), today)
        if p:
            latest_prices[sid] = p

    total_mv = sum(
        float(h.quantity) * latest_prices.get(h.security_id, float(h.market_value) / max(float(h.quantity), 1e-9))
        for h in holdings
    )
    if total_mv <= 0:
        return

    for h in holdings:
        sid = h.security_id
        price = latest_prices.get(sid)
        if price is None:
            continue
        new_mv = float(h.quantity) * price
        new_weight = new_mv / total_mv
        h.market_value = Decimal(str(round(new_mv, 2)))
        h.weight = Decimal(str(round(new_weight, 6)))

    session.flush()


def _get_benchmarks(session: Session) -> list[Benchmark]:
    return list(session.scalars(select(Benchmark)).all())


def _recompute_benchmark_returns(
    session: Session,
    benchmark: Benchmark,
    backfill_days: int,
    errors: list[str],
) -> int:
    """
    Fetch real close prices for the benchmark ticker via yfinance and upsert
    daily_return = (close[d] / close[d-1]) - 1 into benchmark_returns.

    Starts at max(existing date) so the prior close is available to compute
    the first new daily return. ON CONFLICT DO UPDATE — overwrites any
    synthetic seed values with real numbers.
    """
    today = date.today()
    max_date = session.scalar(
        select(func.max(BenchmarkReturn.date)).where(
            BenchmarkReturn.benchmark_id == benchmark.id
        )
    )
    start = (today - timedelta(days=backfill_days)) if max_date is None else max_date

    try:
        rows = market_data.fetch_history(benchmark.ticker, start, today)
    except Exception as exc:
        errors.append(f"benchmark {benchmark.ticker}: {exc}")
        logger.error("benchmark %s fetch failed: %s", benchmark.ticker, exc)
        return 0

    if len(rows) < 2:
        logger.warning("Not enough data for benchmark %s (rows=%d)", benchmark.ticker, len(rows))
        return 0

    upsert_rows: list[dict] = []
    prev_close: Optional[float] = None
    cum_ret = 0.0
    for d, close in rows:
        if prev_close is not None and prev_close > 0:
            daily_ret = (close - prev_close) / prev_close
            cum_ret = (1 + cum_ret) * (1 + daily_ret) - 1
            upsert_rows.append({
                "benchmark_id": benchmark.id,
                "date": d,
                "daily_return": round(daily_ret, 8),
                "cumulative_return": round(cum_ret, 8),
            })
        prev_close = close

    if not upsert_rows:
        return 0

    stmt = pg_insert(BenchmarkReturn).values(upsert_rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["benchmark_id", "date"],
        set_={
            "daily_return": stmt.excluded.daily_return,
            "cumulative_return": stmt.excluded.cumulative_return,
        },
    )
    session.execute(stmt)
    logger.info("Upserted %d benchmark_return rows for %s", len(upsert_rows), benchmark.ticker)
    return len(upsert_rows)


def _wipe_market_data(session: Session) -> None:
    """Destructive: clears Price, PortfolioReturn, BenchmarkReturn for a real-data rebuild."""
    logger.warning("WIPE: clearing Price, PortfolioReturn, BenchmarkReturn tables")
    # Ensure the (benchmark_id, date) unique constraint exists — early seeds
    # were created without it, so ON CONFLICT upserts would fail.
    session.execute(text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_benchmark_returns_benchmark_date "
        "ON benchmark_returns (benchmark_id, date)"
    ))
    session.execute(delete(BenchmarkReturn))
    session.execute(delete(PortfolioReturn))
    session.execute(delete(Price))
    session.flush()


def refresh_all(
    session: Session,
    *,
    portfolio_id: Optional[int] = None,
    backfill_days: int = 365,
    force_rebuild: bool = False,
) -> dict:
    """
    Idempotent refresh of prices, portfolio returns, and benchmark returns.

    Args:
        session: SQLAlchemy session (caller is responsible for commit/rollback).
        portfolio_id: If provided, only refresh securities/portfolios for this portfolio.
        backfill_days: How many calendar days back to pull when no history exists.
        force_rebuild: If True, WIPE Price/PortfolioReturn/BenchmarkReturn first,
            then refetch everything from yfinance. Used to replace synthetic seed
            data with real numbers; ignores portfolio_id.

    Returns:
        {
            "updated_securities": int,
            "updated_benchmarks": int,
            "updated_returns_through": str,   # YYYY-MM-DD (today)
            "skipped": list[str],
            "errors": list[str],
        }
    """
    today = date.today()
    if force_rebuild:
        portfolio_id = None
        _wipe_market_data(session)

    securities = _get_securities(session, portfolio_id)
    updated_securities = 0
    updated_benchmarks = 0
    skipped: list[str] = []
    errors: list[str] = []

    # --- Step 1: Refresh prices for each security ---
    for sec in securities:
        try:
            max_date = _get_max_price_date(session, sec.id)
            if max_date is None:
                start = today - timedelta(days=backfill_days)
            else:
                start = max_date + timedelta(days=1)

            if start > today:
                skipped.append(sec.ticker)
                continue

            rows = market_data.fetch_history(sec.ticker, start, today)
            if not rows:
                logger.warning("No price data returned for %s (start=%s)", sec.ticker, start)
                skipped.append(sec.ticker)
                continue

            inserted = _upsert_prices(session, sec.id, rows)
            if inserted > 0:
                updated_securities += 1
                logger.info("Upserted %d price rows for %s", inserted, sec.ticker)
            else:
                skipped.append(sec.ticker)

        except Exception as exc:
            msg = f"{sec.ticker}: {exc}"
            logger.error("Error refreshing prices for %s: %s", sec.ticker, exc)
            errors.append(msg)

    # Flush prices before computing returns
    try:
        session.flush()
    except Exception as exc:
        errors.append(f"flush prices: {exc}")
        logger.error("Failed to flush prices: %s", exc)

    # --- Step 2: Recompute portfolio returns ---
    portfolios = _get_portfolios(session, portfolio_id)
    for portfolio in portfolios:
        try:
            _recompute_portfolio_returns(session, portfolio, errors)
        except Exception as exc:
            msg = f"portfolio {portfolio.id} returns: {exc}"
            logger.error("Error recomputing returns for portfolio %d: %s", portfolio.id, exc)
            errors.append(msg)

    # --- Step 3: Re-stamp latest holdings with current prices ---
    for portfolio in portfolios:
        try:
            _restamp_latest_holdings(session, portfolio)
        except Exception as exc:
            msg = f"portfolio {portfolio.id} holdings restamp: {exc}"
            logger.error("Error re-stamping holdings for portfolio %d: %s", portfolio.id, exc)
            errors.append(msg)

    # --- Step 4: Refresh benchmark returns from yfinance ---
    for benchmark in _get_benchmarks(session):
        try:
            inserted = _recompute_benchmark_returns(session, benchmark, backfill_days, errors)
            if inserted > 0:
                updated_benchmarks += 1
        except Exception as exc:
            msg = f"benchmark {benchmark.ticker}: {exc}"
            logger.error("Error recomputing benchmark %s: %s", benchmark.ticker, exc)
            errors.append(msg)

    # --- Step 5: Commit and write last-refresh file ---
    try:
        session.commit()
        _write_last_refresh(today)
    except Exception as exc:
        errors.append(f"commit: {exc}")
        logger.error("Failed to commit refresh: %s", exc)
        try:
            session.rollback()
        except Exception:
            pass

    return {
        "updated_securities": updated_securities,
        "updated_benchmarks": updated_benchmarks,
        "updated_returns_through": today.isoformat(),
        "skipped": skipped,
        "errors": errors,
    }
