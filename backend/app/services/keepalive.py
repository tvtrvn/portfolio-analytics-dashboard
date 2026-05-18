"""
keepalive.py — DB health check and refresh status for the /keepalive endpoint.

Agent B should wire this into a GET /keepalive (or /health) route.
No authentication required — intended for uptime monitors and cold-start pings.
"""

import logging
import os
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

_LAST_REFRESH_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", ".last_refresh")
)


def _read_last_refresh() -> Optional[str]:
    """Read the ISO date string from backend/.last_refresh, or None if missing."""
    try:
        with open(_LAST_REFRESH_PATH) as f:
            return f.read().strip() or None
    except FileNotFoundError:
        return None
    except Exception as exc:
        logger.warning("Could not read .last_refresh: %s", exc)
        return None


def ping(session: Session) -> dict:
    """
    Run SELECT 1 to keep the DB connection warm and return a health snapshot.

    Returns:
        {
            "ok": bool,
            "db": "up" | "down",
            "last_refresh": "YYYY-MM-DD" | None,
        }
    """
    try:
        session.execute(text("SELECT 1"))
        db_status = "up"
        ok = True
    except Exception as exc:
        logger.error("keepalive DB ping failed: %s", exc)
        db_status = "down"
        ok = False

    last_refresh = _read_last_refresh()

    return {
        "ok": ok,
        "db": db_status,
        "last_refresh": last_refresh,
    }
