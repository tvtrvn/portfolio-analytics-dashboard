"""
market_data.py — yfinance wrapper with TTL caching and retry.

All public functions return None / empty list on failure — never raise to callers.
Cache TTL is 1 hour; keys include ticker + date range to prevent partial-range collisions.
"""

import logging
from datetime import date, timedelta
from typing import Optional

import yfinance as yf
from cachetools import TTLCache, cached
from cachetools.keys import hashkey

logger = logging.getLogger(__name__)

_history_cache: TTLCache = TTLCache(maxsize=512, ttl=3600)
_latest_cache: TTLCache = TTLCache(maxsize=512, ttl=3600)
_info_cache: TTLCache = TTLCache(maxsize=512, ttl=3600)


def fetch_history(
    ticker: str,
    start: date,
    end: Optional[date] = None,
) -> list[tuple[date, float]]:
    """
    Return [(date, close_price), ...] for ticker between start and end (inclusive).

    yfinance's end is exclusive, so we add one day to include the end date.
    Weekends and holidays simply won't appear in the returned series — callers
    must handle gaps (e.g., carry-forward for return computation).
    Returns [] on any error.
    """
    cache_key = hashkey(ticker, str(start), str(end))
    cached_result = _history_cache.get(cache_key)
    if cached_result is not None:
        return cached_result

    try:
        yf_end = (end + timedelta(days=1)) if end else None
        kwargs: dict = {"start": start.isoformat()}
        if yf_end:
            kwargs["end"] = yf_end.isoformat()

        t = yf.Ticker(ticker)
        hist = t.history(**kwargs)

        if hist.empty:
            logger.warning("fetch_history: no data returned for %s (start=%s, end=%s)", ticker, start, end)
            _history_cache[cache_key] = []
            return []

        result: list[tuple[date, float]] = []
        for ts, row in hist.iterrows():
            # ts is a pandas Timestamp; convert to date
            try:
                d = ts.date() if hasattr(ts, "date") else ts.to_pydatetime().date()
            except Exception:
                d = date.fromisoformat(str(ts)[:10])
            close = float(row["Close"])
            result.append((d, close))

        _history_cache[cache_key] = result
        return result

    except Exception as exc:
        logger.error("fetch_history failed for %s: %s", ticker, exc)
        return []


def fetch_latest_close(ticker: str) -> Optional[tuple[date, float]]:
    """
    Return the most recent (date, close_price) available from yfinance, or None on failure.

    Pulls the last 5 calendar days to account for weekends/holidays.
    """
    cache_key = hashkey("latest", ticker)
    cached_result = _latest_cache.get(cache_key)
    if cached_result is not None:
        # Sentinel: None stored as a special marker
        return None if cached_result == "__none__" else cached_result

    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="5d")
        if hist.empty:
            logger.warning("fetch_latest_close: no data for %s", ticker)
            _latest_cache[cache_key] = "__none__"
            return None

        last_row = hist.iloc[-1]
        ts = hist.index[-1]
        try:
            d = ts.date() if hasattr(ts, "date") else ts.to_pydatetime().date()
        except Exception:
            d = date.fromisoformat(str(ts)[:10])

        result = (d, float(last_row["Close"]))
        _latest_cache[cache_key] = result
        return result

    except Exception as exc:
        logger.error("fetch_latest_close failed for %s: %s", ticker, exc)
        _latest_cache[cache_key] = "__none__"
        return None


def lookup_ticker(ticker: str) -> Optional[dict]:
    """
    Return {ticker, name, sector, asset_class, currency, exchange} or None.

    yfinance .info is unreliable — every field access is guarded.
    Falls back to safe defaults on any missing/error.
    """
    cache_key = hashkey("info", ticker)
    cached_result = _info_cache.get(cache_key)
    if cached_result is not None:
        return None if cached_result == "__none__" else cached_result

    try:
        t = yf.Ticker(ticker)
        info = t.info  # may raise or return minimal dict

        def _get(key: str, default: str) -> str:
            try:
                val = info.get(key)
                return str(val) if val else default
            except Exception:
                return default

        # Determine asset_class from quoteType
        quote_type = _get("quoteType", "").upper()
        if quote_type in ("ETF", "MUTUALFUND"):
            asset_class = "ETF"
        elif quote_type == "EQUITY":
            asset_class = "Equity"
        elif quote_type in ("BOND", "FIXEDINCOME"):
            asset_class = "Fixed Income"
        else:
            asset_class = "Equity"

        result = {
            "ticker": ticker.upper(),
            "name": _get("longName", ticker.upper()) or _get("shortName", ticker.upper()),
            "sector": _get("sector", "Unknown"),
            "asset_class": asset_class,
            "currency": _get("currency", "USD"),
            "exchange": _get("exchange", ""),
        }
        _info_cache[cache_key] = result
        return result

    except Exception as exc:
        logger.error("lookup_ticker failed for %s: %s", ticker, exc)
        _info_cache[cache_key] = "__none__"
        return None
