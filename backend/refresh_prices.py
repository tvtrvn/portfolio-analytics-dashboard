#!/usr/bin/env python3
"""
refresh_prices.py — CLI entrypoint for the daily price refresh.

Usage:
    python refresh_prices.py                        # refresh all securities/portfolios
    python refresh_prices.py --portfolio-id 1       # one portfolio only
    python refresh_prices.py --backfill-days 730    # override backfill window

Exit codes:
    0  — success (errors list is empty)
    1  — one or more per-security/portfolio errors occurred (see JSON output)
"""

import argparse
import json
import logging
import os
import sys

# Allow running from the backend/ directory without installing the package
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.services import refresh_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("refresh_prices")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Refresh live market prices and recompute portfolio returns."
    )
    parser.add_argument(
        "--portfolio-id",
        type=int,
        default=None,
        metavar="ID",
        help="Limit refresh to a single portfolio (and its securities).",
    )
    parser.add_argument(
        "--backfill-days",
        type=int,
        default=365,
        metavar="N",
        help="Number of calendar days to backfill when a security has no price history (default: 365).",
    )
    args = parser.parse_args()

    session = SessionLocal()
    try:
        logger.info(
            "Starting refresh: portfolio_id=%s, backfill_days=%d",
            args.portfolio_id,
            args.backfill_days,
        )
        result = refresh_service.refresh_all(
            session,
            portfolio_id=args.portfolio_id,
            backfill_days=args.backfill_days,
        )
    finally:
        session.close()

    print(json.dumps(result, indent=2))

    if result.get("errors"):
        logger.warning("%d error(s) occurred during refresh.", len(result["errors"]))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
