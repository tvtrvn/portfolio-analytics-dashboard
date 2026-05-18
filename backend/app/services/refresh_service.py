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

from sqlalchemy import select, func, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.models import (
    Security, Price, Portfolio, Holding, PortfolioReturn
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
    Recompute portfolio_returns from the latest holdings snapshot forward to today.
    Uses carry-forward pricing for weekends/holidays/missing prices.
    Upserts rows — ON CONFLICT updates daily_return, cumulative_return, market_value.
    """
    today = date.today()
    snap_date = _get_latest_holdings_date(session, portfolio.id)
    if snap_date is None:
        logger.warning("Portfolio %d has no holdings snapshot; skipping return recompute", portfolio.id)
        return

    holdings = _get_holdings_snapshot(session, portfolio.id, snap_date)
    if not holdings:
        return

    security_ids = [h.security_id for h in holdings]
    quantities: dict[int, float] = {h.security_id: float(h.quantity) for h in holdings}

    # We need prices from one day before snap_date (for day-1 MV) to today
    price_start = snap_date - timedelta(days=7)  # buffer for carry-forward
    prices_by_sec = _get_price_series(session, security_ids, price_start, today)

    # Determine the last existing portfolio_return date for this portfolio
    last_ret_date_stmt = select(func.max(PortfolioReturn.date)).where(
        PortfolioReturn.portfolio_id == portfolio.id
    )
    last_ret_date: Optional[date] = session.scalar(last_ret_date_stmt)

    # Anchor cumulative return from most recent DB row
    anchor_cum_ret: float = 0.0
    if last_ret_date:
        anchor_stmt = select(PortfolioReturn.cumulative_return).where(
            PortfolioReturn.portfolio_id == portfolio.id,
            PortfolioReturn.date == last_ret_date,
        )
        anchor_val = session.scalar(anchor_stmt)
        if anchor_val is not None:
            anchor_cum_ret = float(anchor_val)

    # Compute trading days to fill: day after last existing return up to today
    fill_start = (last_ret_date + timedelta(days=1)) if last_ret_date else snap_date
    trading_days = _generate_trading_dates(fill_start, today)

    if not trading_days:
        return  # already up to date

    upsert_rows: list[dict] = []
    prev_mv: Optional[float] = None
    cum_ret = anchor_cum_ret

    # Compute prev_mv for the day before fill_start
    prev_day = fill_start - timedelta(days=1)
    prev_mv_calc = 0.0
    for sid, qty in quantities.items():
        p = _carry_forward(prices_by_sec.get(sid, {}), prev_day)
        if p:
            prev_mv_calc += qty * p
    prev_mv = prev_mv_calc if prev_mv_calc > 0 else None

    for d in trading_days:
        mv = 0.0
        all_prices_available = True
        for sid, qty in quantities.items():
            p = _carry_forward(prices_by_sec.get(sid, {}), d)
            if p is None:
                all_prices_available = False
                mv += qty * _carry_forward(prices_by_sec.get(sid, {}), snap_date) or 0.0
            else:
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


def refresh_all(
    session: Session,
    *,
    portfolio_id: Optional[int] = None,
    backfill_days: int = 365,
) -> dict:
    """
    Idempotent refresh of prices and portfolio returns.

    Args:
        session: SQLAlchemy session (caller is responsible for commit/rollback).
        portfolio_id: If provided, only refresh securities/portfolios for this portfolio.
        backfill_days: How many calendar days back to pull if a security has no price history.

    Returns:
        {
            "updated_securities": int,
            "updated_returns_through": str,   # YYYY-MM-DD (today)
            "skipped": list[str],
            "errors": list[str],
        }
    """
    today = date.today()
    securities = _get_securities(session, portfolio_id)
    updated_securities = 0
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

    # --- Step 4: Commit and write last-refresh file ---
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
        "updated_returns_through": today.isoformat(),
        "skipped": skipped,
        "errors": errors,
    }
