# Product Requirements Document — Portfolio Analytics Dashboard

> Version 1.0 · April 2026

---

## 1. Purpose

Build a production-grade, full-stack portfolio analytics dashboard that mirrors the internal monitoring tools used by institutional asset management teams. The system enables portfolio managers, investment analysts, and risk teams to monitor multiple portfolios, track performance against benchmarks, assess risk, and attribute returns — all through a single professional web interface.

---

## 2. Goals

- Provide a comprehensive overview of portfolio health in a single dashboard view.
- Enable drill-down into holdings, performance, attribution, and risk across multiple portfolios.
- Compute and display institutional-grade financial metrics (Sharpe ratio, VaR, CVaR, beta, tracking error, information ratio, max drawdown).
- Support benchmark-relative analytics so users can evaluate active management performance.
- Support flexible time period filtering (1M, 3M, 6M, YTD, 1Y, Since Inception).
- Deploy as a publicly accessible demo suitable for a portfolio project.

## 3. Non-goals

- Real-time market data feeds or live trade execution.
- User authentication or multi-tenant access control.
- Mobile-first design (this is a desktop-first tool for analysts on wide screens).
- Algorithmic trading, backtesting, or strategy optimization.
- PDF report generation or scheduled email digests.

---

## 4. Users

| User group | Description | Primary tasks |
| --- | --- | --- |
| Portfolio Manager | Oversees investment strategy for one or more portfolios | Monitor overall performance, check drift, review attribution |
| Investment Analyst | Researches securities and supports portfolio decisions | Drill into holdings, analyze sector/security contributions |
| Risk Analyst | Monitors portfolio risk exposure | Review VaR/CVaR, volatility trends, drawdown, beta |
| Interviewer / Recruiter | Evaluates the candidate's technical work | Browse the live demo, inspect code quality, review architecture |

---

## 5. Functional Requirements

### 5.1 Dashboard Overview

- Display six KPI cards: Total Market Value, Daily Return, Cumulative Return, Volatility, Sharpe Ratio, Max Drawdown.
- Display additional KPI row when benchmark data is available: Annualized Return, Tracking Error, Information Ratio, Portfolio Health indicator.
- Render a cumulative performance line chart (portfolio vs benchmark).
- Render sector allocation and asset class allocation donut charts.
- Display a top-5 positions table sorted by market value.

### 5.2 Holdings & Exposures

- Display a sortable table of all holdings with: ticker, name, sector, asset class, weight, target weight, weight drift, market value, quantity.
- Support filtering by sector dropdown, asset class dropdown, and free-text search (ticker or name).
- Support CSV export of the current filtered view.
- Show total position count and total market value in the header.

### 5.3 Performance Analytics

- Display KPI cards: Cumulative Return, Annualized Return, Benchmark Return, Excess Return, Tracking Error, Information Ratio.
- Render a multi-line chart: portfolio cumulative return, benchmark cumulative return, and excess return.
- Render rolling volatility chart (30-day and 90-day windows).
- Render drawdown analysis chart.

### 5.4 Attribution Analysis

- Display KPI cards: Total Portfolio Return, Benchmark Return, Excess Return.
- Render top-5 contributors and bottom-5 contributors as horizontal bar charts.
- Render contribution by sector as a bar chart.
- Display sector attribution detail table with weight and contribution columns, exportable to CSV.
- Display security-level attribution table with ticker, name, sector, weight, and contribution, exportable to CSV.

### 5.5 Risk Metrics

- Display KPI cards: Annualized Volatility, Sharpe Ratio, Max Drawdown (with date range), VaR (95%), CVaR (95%), Beta.
- Display secondary row: Tracking Error, Information Ratio, Risk Assessment (traffic light), Concentration Alert.
- Render rolling volatility chart (portfolio and benchmark).
- Render historical drawdown chart (portfolio and benchmark).

### 5.6 Multi-Portfolio Support

- Support switching between portfolios via the sidebar.
- Persist the selected portfolio globally across all pages.
- Each portfolio has its own strategy, currency, benchmark, and data.

### 5.7 Time Period Filtering

- Support period codes: 1M, 3M, 6M, YTD, 1Y, SI (Since Inception).
- Period selection is global — changing it updates all data on the current page.
- All analytics endpoints accept optional `period`, `start_date`, `end_date` query parameters.

---

## 6. Technical Architecture

### 6.1 Frontend

| Concern | Technology |
| --- | --- |
| Framework | React 18 with TypeScript |
| Build tool | Vite 5 |
| State management | Redux Toolkit (4 slices: portfolio, holdings, analytics, filters) |
| Routing | React Router v6 with a shared Layout wrapper |
| Styling | Tailwind CSS 3 with custom configuration |
| Charts | Recharts (line, area, bar, pie/donut) |
| Icons | Lucide React |
| API client | Typed fetch wrapper with generic `api.get<T>()` |

### 6.2 Backend

| Concern | Technology |
| --- | --- |
| Framework | FastAPI (Python 3.11) |
| ORM | SQLAlchemy 2.0 with declarative models |
| Validation | Pydantic v2 + pydantic-settings |
| Analytics | Pure NumPy/Python calculation module (no DB dependency) |
| Configuration | Environment variables via pydantic-settings with `.env` fallback |

### 6.3 Database

| Concern | Technology |
| --- | --- |
| Engine | PostgreSQL 14+ |
| Hosting | Koyeb Managed PostgreSQL |
| Schema | 8 normalized tables with composite indexes on hot query paths |

### 6.4 Deployment

| Component | Platform |
| --- | --- |
| Frontend | Vercel (auto-deploys from `main`) |
| Backend | Koyeb Web Service (buildpack, auto-deploys from `main`) |
| Database | Koyeb Managed PostgreSQL |

---

## 7. Data Model

### Tables

- **`portfolios`** — id, name, strategy, benchmark_id (FK), inception_date, currency, description, created_at, updated_at.
- **`benchmarks`** — id, name, ticker (unique).
- **`securities`** — id, ticker (unique, indexed), name, sector, asset_class, currency, exchange.
- **`holdings`** — id, portfolio_id (FK), security_id (FK), date, quantity, market_value, weight, target_weight, cost_basis. Composite index on `(portfolio_id, date)`.
- **`prices`** — id, security_id (FK), date, close_price, open_price, volume. Composite index on `(security_id, date)`.
- **`portfolio_returns`** — id, portfolio_id (FK), date, daily_return, cumulative_return, market_value. Composite index on `(portfolio_id, date)`.
- **`benchmark_returns`** — id, benchmark_id (FK), date, daily_return, cumulative_return. Composite index on `(benchmark_id, date)`.
- **`transactions`** — id, portfolio_id (FK), security_id (FK), date, transaction_type, quantity, price, amount. Composite index on `(portfolio_id, date)`.

### Seed Data

- 4 portfolios ($100M–$250M AUM) across four strategies.
- 34 securities: 18 Canadian equities, 8 US equities, 4 fixed income ETFs, 2 alternatives.
- 4 benchmark indices: S&P/TSX Composite, S&P 500, FTSE Canada Bond, MSCI World.
- ~850+ trading days of simulated price data using geometric Brownian motion.
- Holdings snapshots on every Friday and month-end.
- 50 sample transactions per portfolio.

---

## 8. API Design

All endpoints are prefixed with `/api`. Analytics endpoints accept optional `period`, `start_date`, and `end_date` query parameters. Period is validated against the regex `^(1M|3M|6M|YTD|1Y|SI)$`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/portfolios` | List all portfolios |
| GET | `/portfolios/{id}/summary` | KPIs, top positions, as-of date |
| GET | `/portfolios/{id}/holdings` | All holdings with optional search, sector, asset_class filters |
| GET | `/portfolios/{id}/performance` | Cumulative return series with benchmark overlay |
| GET | `/portfolios/{id}/sector-allocation` | Sector weight breakdown |
| GET | `/portfolios/{id}/asset-allocation` | Asset class weight breakdown |
| GET | `/portfolios/{id}/attribution` | Security and sector-level return attribution |
| GET | `/portfolios/{id}/benchmark-comparison` | Portfolio vs benchmark with tracking error and IR |
| GET | `/portfolios/{id}/risk-metrics` | VaR, CVaR, beta, rolling volatility, drawdown series |
| GET | `/health` | Health check |

---

## 9. Non-Functional Requirements

| Requirement | Target |
| --- | --- |
| Response time | < 500ms for all API endpoints on seeded data |
| Concurrent users | Designed for demo/portfolio use (single-digit concurrent users) |
| Availability | Dependent on Vercel and Koyeb free tiers |
| Data precision | `Numeric(18,2)` for dollar amounts, `Numeric(12,8)` for returns |
| Browser support | Modern evergreen browsers (Chrome, Firefox, Safari, Edge) |
| Screen size | Optimized for 1280px+ desktops; functional down to 768px |

---

## 10. Analytics Calculations

All calculations are implemented in a pure Python module (`services/analytics.py`) with no database dependency:

- **Cumulative Return** — Compound product of (1 + daily_return) minus 1.
- **Annualized Return** — Geometric scaling assuming 252 trading days per year.
- **Annualized Volatility** — Standard deviation of daily returns × √252.
- **Sharpe Ratio** — (Annualized return − risk-free rate) / annualized volatility.
- **Max Drawdown** — Maximum peak-to-trough decline using running maximum.
- **Rolling Volatility** — Windowed annualized volatility (30-day and 90-day).
- **Tracking Error** — Annualized standard deviation of daily excess returns.
- **Information Ratio** — Annualized excess return / tracking error.
- **Beta** — Cov(Rp, Rb) / Var(Rb) from the covariance matrix.
- **VaR (95%)** — Historical 5th percentile of daily returns.
- **CVaR (95%)** — Mean of returns below the VaR threshold (expected shortfall).

---

## 11. Acceptance Criteria

- [ ] Dashboard loads with KPI cards, performance chart, allocation charts, and top positions within 2 seconds.
- [ ] Switching portfolios in the sidebar updates all data across all pages.
- [ ] Changing the time period filter refreshes all analytics for the selected range.
- [ ] Holdings page supports search, sector filter, asset class filter, and CSV export.
- [ ] Performance page renders portfolio vs benchmark line chart with excess return.
- [ ] Attribution page shows top/bottom contributors and sector-level breakdown.
- [ ] Risk page displays VaR, CVaR, Sharpe, beta, rolling volatility, and drawdown charts.
- [ ] All API endpoints return proper error responses (404 for missing portfolios, 422 for invalid parameters).
- [ ] Application is deployed and accessible at public URLs.

---

## 12. Future Enhancements

- User authentication with role-based access (PM vs analyst vs read-only).
- Real-time market data integration via a third-party API.
- PDF report generation for client presentations.
- Alembic database migrations for schema evolution.
- Transaction history page with filtering and aggregation.
- Custom date range picker alongside period codes.
- Dark mode theme toggle.
- WebSocket-based live updates instead of manual refresh.
