"""
Seed script: generates realistic institutional-grade sample data.
Run with: python seed.py
Requires DATABASE_URL env var or .env file.
"""

import os, sys, random, math
from datetime import date, timedelta
from decimal import Decimal

import numpy as np
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models.models import (
    Portfolio, Benchmark, Security, Holding,
    Price, PortfolioReturn, BenchmarkReturn, Transaction,
)

random.seed(42)
np.random.seed(42)

TRADING_DAYS_PER_YEAR = 252


def generate_business_days(start: date, end: date) -> list[date]:
    days = []
    current = start
    while current <= end:
        if current.weekday() < 5:
            days.append(current)
        current += timedelta(days=1)
    return days


BENCHMARKS = [
    {"name": "S&P/TSX Composite Index", "ticker": "^GSPTSE"},
    {"name": "S&P 500 Index", "ticker": "^GSPC"},
    {"name": "FTSE Canada Universe Bond Index", "ticker": "XBB.TO"},
    {"name": "MSCI World Index", "ticker": "URTH"},
]

SECURITIES = [
    # Canadian Equities
    {"ticker": "RY.TO", "name": "Royal Bank of Canada", "sector": "Financials", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 135.0},
    {"ticker": "TD.TO", "name": "Toronto-Dominion Bank", "sector": "Financials", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 85.0},
    {"ticker": "ENB.TO", "name": "Enbridge Inc.", "sector": "Energy", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 52.0},
    {"ticker": "CNR.TO", "name": "Canadian National Railway", "sector": "Industrials", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 165.0},
    {"ticker": "SHOP.TO", "name": "Shopify Inc.", "sector": "Technology", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 95.0},
    {"ticker": "BMO.TO", "name": "Bank of Montreal", "sector": "Financials", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 125.0},
    {"ticker": "BNS.TO", "name": "Bank of Nova Scotia", "sector": "Financials", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 68.0},
    {"ticker": "SU.TO", "name": "Suncor Energy", "sector": "Energy", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 45.0},
    {"ticker": "TRP.TO", "name": "TC Energy Corp.", "sector": "Energy", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 55.0},
    {"ticker": "BCE.TO", "name": "BCE Inc.", "sector": "Communication Services", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 48.0},
    {"ticker": "T.TO", "name": "TELUS Corp.", "sector": "Communication Services", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 27.0},
    {"ticker": "ABX.TO", "name": "Barrick Gold Corp.", "sector": "Materials", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 22.0},
    {"ticker": "FTS.TO", "name": "Fortis Inc.", "sector": "Utilities", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 58.0},
    {"ticker": "MFC.TO", "name": "Manulife Financial", "sector": "Financials", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 32.0},
    {"ticker": "NTR.TO", "name": "Nutrien Ltd.", "sector": "Materials", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 65.0},
    {"ticker": "CSU.TO", "name": "Constellation Software", "sector": "Technology", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 3200.0},
    {"ticker": "GIB-A.TO", "name": "CGI Inc.", "sector": "Technology", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 145.0},
    {"ticker": "RCI-B.TO", "name": "Rogers Communications", "sector": "Communication Services", "asset_class": "Canadian Equity", "currency": "CAD", "exchange": "TSX", "base_price": 52.0},
    # US Equities
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology", "asset_class": "US Equity", "currency": "USD", "exchange": "NASDAQ", "base_price": 185.0},
    {"ticker": "MSFT", "name": "Microsoft Corp.", "sector": "Technology", "asset_class": "US Equity", "currency": "USD", "exchange": "NASDAQ", "base_price": 380.0},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary", "asset_class": "US Equity", "currency": "USD", "exchange": "NASDAQ", "base_price": 175.0},
    {"ticker": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare", "asset_class": "US Equity", "currency": "USD", "exchange": "NYSE", "base_price": 158.0},
    {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financials", "asset_class": "US Equity", "currency": "USD", "exchange": "NYSE", "base_price": 195.0},
    {"ticker": "PG", "name": "Procter & Gamble Co.", "sector": "Consumer Staples", "asset_class": "US Equity", "currency": "USD", "exchange": "NYSE", "base_price": 162.0},
    {"ticker": "UNH", "name": "UnitedHealth Group", "sector": "Healthcare", "asset_class": "US Equity", "currency": "USD", "exchange": "NYSE", "base_price": 520.0},
    {"ticker": "XOM", "name": "Exxon Mobil Corp.", "sector": "Energy", "asset_class": "US Equity", "currency": "USD", "exchange": "NYSE", "base_price": 108.0},
    # Fixed Income (ETF proxies)
    {"ticker": "XBB.TO", "name": "iShares Core Cdn Universe Bond", "sector": "Fixed Income", "asset_class": "Fixed Income", "currency": "CAD", "exchange": "TSX", "base_price": 28.0},
    {"ticker": "ZAG.TO", "name": "BMO Aggregate Bond ETF", "sector": "Fixed Income", "asset_class": "Fixed Income", "currency": "CAD", "exchange": "TSX", "base_price": 14.5},
    {"ticker": "XCB.TO", "name": "iShares Cdn Corporate Bond", "sector": "Fixed Income", "asset_class": "Fixed Income", "currency": "CAD", "exchange": "TSX", "base_price": 20.0},
    {"ticker": "CLF.TO", "name": "iShares 1-5 Year Laddered Corp Bond", "sector": "Fixed Income", "asset_class": "Fixed Income", "currency": "CAD", "exchange": "TSX", "base_price": 17.5},
    # Alternatives / REIT
    {"ticker": "XRE.TO", "name": "iShares S&P/TSX Capped REIT", "sector": "Real Estate", "asset_class": "Alternatives", "currency": "CAD", "exchange": "TSX", "base_price": 15.0},
    {"ticker": "GLD", "name": "SPDR Gold Shares", "sector": "Materials", "asset_class": "Alternatives", "currency": "USD", "exchange": "NYSE", "base_price": 195.0},
]

PORTFOLIO_CONFIGS = [
    {
        "name": "Growth Equity Portfolio",
        "strategy": "Growth Equity",
        "benchmark_ticker": "^GSPC",
        "currency": "CAD",
        "description": "Concentrated growth-oriented equity portfolio focused on high-quality North American companies with strong earnings growth.",
        "target_mv": 150_000_000,
        "security_weights": {
            "SHOP.TO": 0.08, "CSU.TO": 0.07, "AAPL": 0.09, "MSFT": 0.10,
            "AMZN": 0.08, "RY.TO": 0.06, "CNR.TO": 0.05, "TD.TO": 0.05,
            "JPM": 0.04, "UNH": 0.06, "GIB-A.TO": 0.04, "MFC.TO": 0.03,
            "ENB.TO": 0.03, "NTR.TO": 0.03, "PG": 0.03, "SU.TO": 0.02,
            "ABX.TO": 0.02, "XOM": 0.03, "JNJ": 0.04, "BCE.TO": 0.02,
            "XRE.TO": 0.01, "GLD": 0.02,
        },
        "drift_factor": 0.012,
    },
    {
        "name": "Balanced Income Portfolio",
        "strategy": "Balanced Income",
        "benchmark_ticker": "^GSPTSE",
        "currency": "CAD",
        "description": "Diversified balanced mandate combining Canadian equities and fixed income for stable income generation with moderate growth.",
        "target_mv": 250_000_000,
        "security_weights": {
            "RY.TO": 0.06, "TD.TO": 0.05, "BMO.TO": 0.04, "BNS.TO": 0.04,
            "ENB.TO": 0.05, "TRP.TO": 0.04, "BCE.TO": 0.04, "T.TO": 0.03,
            "FTS.TO": 0.04, "MFC.TO": 0.03, "CNR.TO": 0.03, "NTR.TO": 0.02,
            "ABX.TO": 0.02, "XBB.TO": 0.12, "ZAG.TO": 0.10, "XCB.TO": 0.08,
            "CLF.TO": 0.08, "XRE.TO": 0.05, "PG": 0.02, "JNJ": 0.02,
            "GLD": 0.02, "RCI-B.TO": 0.02,
        },
        "drift_factor": 0.006,
    },
    {
        "name": "Canadian Dividend Portfolio",
        "strategy": "Canadian Dividend",
        "benchmark_ticker": "^GSPTSE",
        "currency": "CAD",
        "description": "High-conviction Canadian dividend strategy targeting above-average yield with capital appreciation from blue-chip equities.",
        "target_mv": 100_000_000,
        "security_weights": {
            "RY.TO": 0.10, "TD.TO": 0.09, "BMO.TO": 0.07, "BNS.TO": 0.07,
            "ENB.TO": 0.08, "TRP.TO": 0.06, "BCE.TO": 0.06, "T.TO": 0.05,
            "FTS.TO": 0.06, "MFC.TO": 0.05, "CNR.TO": 0.04, "SU.TO": 0.04,
            "NTR.TO": 0.03, "ABX.TO": 0.03, "XRE.TO": 0.05, "RCI-B.TO": 0.04,
            "GIB-A.TO": 0.03, "XBB.TO": 0.05,
        },
        "drift_factor": 0.008,
    },
    {
        "name": "Global Macro Portfolio",
        "strategy": "Global Macro",
        "benchmark_ticker": "URTH",
        "currency": "CAD",
        "description": "Tactical global multi-asset strategy with dynamic allocation across equities, fixed income, commodities, and alternatives.",
        "target_mv": 200_000_000,
        "security_weights": {
            "AAPL": 0.07, "MSFT": 0.07, "AMZN": 0.05, "JPM": 0.04,
            "UNH": 0.04, "XOM": 0.05, "JNJ": 0.04, "PG": 0.03,
            "RY.TO": 0.04, "SHOP.TO": 0.03, "ENB.TO": 0.03, "CNR.TO": 0.03,
            "XBB.TO": 0.08, "ZAG.TO": 0.06, "XCB.TO": 0.05, "CLF.TO": 0.04,
            "GLD": 0.06, "XRE.TO": 0.04, "ABX.TO": 0.03, "SU.TO": 0.03,
            "NTR.TO": 0.02, "FTS.TO": 0.02, "BCE.TO": 0.02, "TD.TO": 0.03,
        },
        "drift_factor": 0.010,
    },
]


def generate_prices(base_price: float, days: list[date], asset_class: str) -> list[dict]:
    """Generate realistic price series using geometric Brownian motion."""
    if "Fixed Income" in asset_class:
        annual_drift = 0.03
        annual_vol = 0.04
    elif "Alternative" in asset_class or asset_class == "Alternatives":
        annual_drift = 0.06
        annual_vol = 0.12
    else:
        annual_drift = 0.08
        annual_vol = 0.20

    daily_drift = annual_drift / TRADING_DAYS_PER_YEAR
    daily_vol = annual_vol / math.sqrt(TRADING_DAYS_PER_YEAR)

    prices = []
    price = base_price
    for d in days:
        shock = np.random.normal(daily_drift, daily_vol)
        price *= (1 + shock)
        price = max(price * 0.5, price)  # floor at half
        volume = int(np.random.lognormal(14, 1.5))
        prices.append({
            "date": d,
            "close_price": round(price, 4),
            "open_price": round(price * (1 + np.random.normal(0, 0.003)), 4),
            "volume": volume,
        })
    return prices


def generate_benchmark_returns(days: list[date], annual_ret: float, annual_vol: float) -> list[dict]:
    daily_drift = annual_ret / TRADING_DAYS_PER_YEAR
    daily_vol = annual_vol / math.sqrt(TRADING_DAYS_PER_YEAR)
    cum = 0.0
    result = []
    for d in days:
        r = np.random.normal(daily_drift, daily_vol)
        cum = (1 + cum) * (1 + r) - 1
        result.append({"date": d, "daily_return": round(r, 8), "cumulative_return": round(cum, 8)})
    return result


BENCHMARK_PARAMS = {
    "^GSPTSE": (0.07, 0.14),
    "^GSPC": (0.10, 0.16),
    "XBB.TO": (0.03, 0.04),
    "URTH": (0.08, 0.15),
}


def seed():
    print("Creating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        inception = date(2023, 1, 3)
        end = date(2025, 4, 11)
        trading_days = generate_business_days(inception, end)
        print(f"Generated {len(trading_days)} trading days from {inception} to {end}")

        # --- Benchmarks ---
        benchmark_map: dict[str, Benchmark] = {}
        for b in BENCHMARKS:
            obj = Benchmark(name=b["name"], ticker=b["ticker"])
            db.add(obj)
            db.flush()
            benchmark_map[b["ticker"]] = obj
        print(f"Created {len(BENCHMARKS)} benchmarks")

        # --- Benchmark Returns ---
        for ticker, bm in benchmark_map.items():
            ann_ret, ann_vol = BENCHMARK_PARAMS[ticker]
            rets = generate_benchmark_returns(trading_days, ann_ret, ann_vol)
            for r in rets:
                db.add(BenchmarkReturn(
                    benchmark_id=bm.id,
                    date=r["date"],
                    daily_return=r["daily_return"],
                    cumulative_return=r["cumulative_return"],
                ))
        db.flush()
        print("Generated benchmark returns")

        # --- Securities ---
        security_map: dict[str, Security] = {}
        for s in SECURITIES:
            obj = Security(
                ticker=s["ticker"], name=s["name"], sector=s["sector"],
                asset_class=s["asset_class"], currency=s["currency"], exchange=s["exchange"],
            )
            db.add(obj)
            db.flush()
            security_map[s["ticker"]] = obj

        print(f"Created {len(SECURITIES)} securities")

        # --- Prices ---
        sec_price_map: dict[str, dict[date, float]] = {}
        for s in SECURITIES:
            ticker = s["ticker"]
            prices = generate_prices(s["base_price"], trading_days, s["asset_class"])
            sec_price_map[ticker] = {}
            for p in prices:
                sec_price_map[ticker][p["date"]] = p["close_price"]
                db.add(Price(
                    security_id=security_map[ticker].id,
                    date=p["date"],
                    close_price=p["close_price"],
                    open_price=p["open_price"],
                    volume=p["volume"],
                ))
        db.flush()
        print("Generated price histories")

        # --- Portfolios, Holdings, Returns ---
        for cfg in PORTFOLIO_CONFIGS:
            bm = benchmark_map[cfg["benchmark_ticker"]]
            portfolio = Portfolio(
                name=cfg["name"],
                strategy=cfg["strategy"],
                benchmark_id=bm.id,
                inception_date=inception,
                currency=cfg["currency"],
                description=cfg["description"],
            )
            db.add(portfolio)
            db.flush()
            print(f"Creating portfolio: {cfg['name']}")

            base_weights = cfg["security_weights"]
            target_mv = cfg["target_mv"]
            drift = cfg["drift_factor"]

            # Track running weights with random drift
            current_weights = dict(base_weights)
            cum_ret = 0.0
            mv = target_mv

            for i, day in enumerate(trading_days):
                # Apply small random drift to weights periodically
                if i > 0 and i % 20 == 0:
                    for tk in current_weights:
                        current_weights[tk] *= (1 + np.random.normal(0, drift))
                    total_w = sum(current_weights.values())
                    for tk in current_weights:
                        current_weights[tk] /= total_w

                # Portfolio daily return = weighted sum of security returns
                port_daily_ret = 0.0
                for tk, w in current_weights.items():
                    if i == 0:
                        sec_ret = 0.0
                    else:
                        prev_price = sec_price_map[tk].get(trading_days[i - 1], 0)
                        curr_price = sec_price_map[tk].get(day, 0)
                        sec_ret = (curr_price / prev_price - 1) if prev_price > 0 else 0.0
                    port_daily_ret += w * sec_ret

                cum_ret = (1 + cum_ret) * (1 + port_daily_ret) - 1
                mv = target_mv * (1 + cum_ret)

                db.add(PortfolioReturn(
                    portfolio_id=portfolio.id,
                    date=day,
                    daily_return=round(port_daily_ret, 8),
                    cumulative_return=round(cum_ret, 8),
                    market_value=round(mv, 2),
                ))

                # Holdings snapshot (weekly + last day of month + first + last day)
                is_snapshot = (
                    i == 0
                    or i == len(trading_days) - 1
                    or day.weekday() == 4  # every Friday
                    or (i + 1 < len(trading_days) and trading_days[i + 1].month != day.month)
                )
                if is_snapshot:
                    for tk, w in current_weights.items():
                        sec = security_map[tk]
                        sec_mv = mv * w
                        price = sec_price_map[tk].get(day, 1)
                        qty = sec_mv / price if price > 0 else 0

                        target_w = base_weights.get(tk, w)
                        cost = sec_mv * (1 - np.random.uniform(0, 0.08))

                        db.add(Holding(
                            portfolio_id=portfolio.id,
                            security_id=sec.id,
                            date=day,
                            quantity=round(qty, 4),
                            market_value=round(sec_mv, 2),
                            weight=round(w, 6),
                            target_weight=round(target_w, 6),
                            cost_basis=round(cost, 2),
                        ))

            # Sample transactions
            for _ in range(50):
                day = random.choice(trading_days)
                tk = random.choice(list(base_weights.keys()))
                sec = security_map[tk]
                price = sec_price_map[tk].get(day, 100)
                qty = round(random.uniform(100, 5000), 0)
                tx_type = random.choice(["buy", "sell", "buy", "dividend"])
                amount = round(qty * price, 2)

                db.add(Transaction(
                    portfolio_id=portfolio.id,
                    security_id=sec.id,
                    date=day,
                    transaction_type=tx_type,
                    quantity=qty,
                    price=round(price, 4),
                    amount=amount,
                ))

            print(f"  -> Holdings and returns generated for {cfg['name']}")

        db.commit()
        print("\nSeed complete!")

    except Exception as exc:
        db.rollback()
        print(f"Error during seeding: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
