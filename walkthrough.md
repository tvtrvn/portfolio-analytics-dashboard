# Portfolio Analytics Dashboard — Complete Codebase Walkthrough

A comprehensive guide for engineers and analysts who want to understand every part of this application: what it does, how it works, where each piece lives, and what every term means.

---

## 1. Introduction

This application is a production-quality, institutional-grade portfolio analytics dashboard. Think of it as the kind of internal tool a portfolio manager or investment analyst at a firm like TD Asset Management would use every day. Instead of a spreadsheet, they get an interactive web app that shows everything about their portfolios in one place.

The app ships with four simulated sample portfolios, each representing a different investment strategy:

| Portfolio | Strategy | Benchmark | Approximate AUM |
|---|---|---|---|
| Growth Equity Portfolio | Growth Equity | S&P 500 Index | ~$150 million |
| Balanced Income Portfolio | Balanced Income | S&P/TSX Composite | ~$250 million |
| Canadian Dividend Portfolio | Canadian Dividend | S&P/TSX Composite | ~$100 million |
| Global Macro Portfolio | Global Macro | MSCI World Index | ~$200 million |

Users can switch between portfolios using a dropdown in the top navigation bar and filter analytics by time period (1M, 3M, 6M, YTD, 1Y, Since Inception).

The application provides five analytics pages:

1. **Dashboard** — headline KPIs, performance chart, sector and asset class allocation, top positions.
2. **Holdings** — full position table with search, filtering, sorting, and CSV export.
3. **Performance** — cumulative return chart vs benchmark, rolling volatility, drawdown analysis.
4. **Attribution** — which securities and sectors drove returns; best/worst contributors.
5. **Risk Metrics** — VaR, CVaR, beta, Sharpe ratio, tracking error, information ratio, rolling volatility.

---

## 2. High-Level Architecture

The application is split into three tiers: a browser-based frontend, a Python API server, and a relational database.

```
+---------------------------+
|       User's Browser      |
|  React + Redux + Recharts |
|  (Vercel / localhost:5173)|
+------------+--------------+
             |
             | HTTPS (JSON over REST)
             |
+------------+--------------+
|    FastAPI Application    |
|  Python / SQLAlchemy      |
|  (Koyeb / localhost:8000) |
+------------+--------------+
             |
             | SQLAlchemy ORM (psycopg2)
             |
+------------+--------------+
|      PostgreSQL DB        |
|  (Koyeb Managed Postgres  |
|   / local createdb)       |
+---------------------------+
```

**Request lifecycle in plain English:**

1. The user opens the dashboard in a browser. React renders the shell (sidebar, header) immediately.
2. The `Header` component dispatches a `fetchPortfolios` Redux thunk on mount, which calls `GET /api/portfolios` on the FastAPI server.
3. The FastAPI route handler calls `portfolio_service.list_portfolios(db)`, which issues a SQL `SELECT` on the `portfolios` table, joins to `benchmarks` for the benchmark name, and returns a JSON list.
4. Redux stores the list in `state.portfolio.list`. React re-renders the dropdown with the portfolio names.
5. The user selects a portfolio or the first one is auto-selected. The `Dashboard` page's `useEffect` fires, dispatching four more thunks (summary, performance, sector allocation, asset allocation).
6. Each thunk calls the corresponding API endpoint, which fetches data from PostgreSQL, passes daily return arrays through the analytics module, and returns computed metrics as JSON.
7. Redux stores each response in its slice. React charts and KPI cards read from the store and render.

---

## 3. Tech Stack at a Glance

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | React 18 | UI components and routing |
| Language | TypeScript | Type safety across the frontend |
| State management | Redux Toolkit | Global state, async data fetching |
| Routing | React Router v6 | Client-side URL routing |
| Charts | Recharts | Area, line, bar, and pie charts |
| Icons | Lucide React | SVG icon set |
| Styling | Tailwind CSS v3 | Utility-first CSS with custom clay tokens |
| Frontend build | Vite 5 | Dev server, proxy, production bundler |
| Backend framework | FastAPI | REST API with automatic OpenAPI docs |
| ORM | SQLAlchemy 2 | Database access and schema management |
| Data validation | Pydantic v2 | Request/response schema validation |
| Database | PostgreSQL 14+ | Relational data store |
| Numerical computing | NumPy | Financial math (std dev, cumprod, etc.) |
| Date arithmetic | python-dateutil | Relative date offsets for period calculations |
| Deployment (frontend) | Vercel | CDN-backed static hosting |
| Deployment (backend) | Koyeb | Container hosting for FastAPI + managed Postgres |

---

## 4. Project Layout

```
portfolio-analytics-dashboard-app/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS middleware, router registration
│   │   ├── config.py             # Settings class (DATABASE_URL, CORS_ORIGINS, RISK_FREE_RATE)
│   │   ├── database.py           # SQLAlchemy engine, SessionLocal, Base, get_db dependency
│   │   ├── models/
│   │   │   └── models.py         # All 8 ORM model classes (Portfolio, Benchmark, Security, …)
│   │   ├── schemas/
│   │   │   └── schemas.py        # All Pydantic request/response schemas
│   │   ├── routes/
│   │   │   └── portfolios.py     # All 9 API endpoint functions
│   │   └── services/
│   │       ├── portfolio_service.py  # Service layer: fetch + compute per endpoint
│   │       ├── analytics.py          # Pure math functions: returns, risk, attribution
│   │       ├── market_data.py        # yfinance wrapper with TTLCache (v2)
│   │       ├── refresh_service.py    # Price refresh orchestration (v2)
│   │       └── keepalive.py          # Liveness probe (v2)
│   ├── seed.py                   # First-run demo data seeder (GBM prices)
│   ├── refresh_prices.py         # CLI: python refresh_prices.py [--portfolio-id N] (v2)
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Template for environment variables
└── frontend/
    ├── src/
    │   ├── main.tsx              # React root: Provider (Redux) + App + CSS
    │   ├── App.tsx               # BrowserRouter, Routes, Layout wrapper
    │   ├── index.css             # Tailwind imports + clay component classes
    │   ├── api/
    │   │   ├── client.ts         # Base fetch wrapper, ApiError class
    │   │   └── portfolioApi.ts   # Typed API methods for every endpoint
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Layout.tsx    # Shell: Sidebar + Header + <Outlet />
    │   │   │   ├── Sidebar.tsx   # Fixed left navigation with NavLinks
    │   │   │   └── Header.tsx    # Sticky top bar: portfolio picker, period selector, editor buttons (v2)
    │   │   ├── modals/           # Holdings editor modals (v2)
    │   │   │   ├── Modal.tsx               # Generic accessible modal wrapper
    │   │   │   ├── PortfolioFormModal.tsx  # Create/edit portfolio form
    │   │   │   ├── HoldingFormModal.tsx    # Add/edit holding with ticker lookup
    │   │   │   └── ConfirmDialog.tsx       # Destructive-action confirmation prompt
    │   │   ├── common/
    │   │   │   ├── KPICard.tsx   # Metric card with trend pill
    │   │   │   ├── DataTable.tsx # Sortable, exportable table (generic over T)
    │   │   │   ├── PeriodSelector.tsx  # 1M/3M/6M/YTD/1Y/SI tab strip
    │   │   │   ├── Term.tsx      # Inline glossary tooltip component
    │   │   │   ├── LoadingSpinner.tsx  # Spinner, SkeletonCard, SkeletonChart
    │   │   │   ├── ErrorState.tsx     # Error message + retry button
    │   │   │   └── EmptyState.tsx     # Empty state message
    │   │   └── charts/
    │   │       ├── PerformanceChart.tsx   # Area chart: portfolio vs benchmark
    │   │       ├── AllocationChart.tsx    # Donut chart: sector or asset class
    │   │       ├── ContributionChart.tsx  # Bar chart: return contributions
    │   │       ├── DrawdownChart.tsx      # Area chart: drawdown over time
    │   │       └── VolatilityChart.tsx    # Line chart: rolling 30/90-day vol
    │   ├── pages/
    │   │   ├── Dashboard.tsx     # Overview page: 6 KPIs, charts, top positions
    │   │   ├── Holdings.tsx      # Holdings table with search + filter
    │   │   ├── Performance.tsx   # Performance charts + benchmark comparison
    │   │   ├── Attribution.tsx   # Return attribution by security and sector
    │   │   └── RiskMetrics.tsx   # Risk dashboard: VaR, beta, volatility charts
    │   ├── store/
    │   │   ├── store.ts          # Redux store configuration, typed hooks
    │   │   └── slices/
    │   │       ├── portfolioSlice.ts  # Portfolios list + summary state + thunks
    │   │       ├── holdingsSlice.ts   # Holdings data state + thunk
    │   │       ├── analyticsSlice.ts  # All analytics states + 6 thunks
    │   │       └── filterSlice.ts     # Selected portfolio, period, filters
    │   ├── types/
    │   │   └── index.ts          # TypeScript interfaces mirroring Pydantic schemas
    │   └── utils/
    │       ├── format.ts         # Currency, percent, date formatting helpers
    │       ├── csv.ts            # CSV download helper (Blob + anchor trigger)
    │       └── glossary.ts       # Full glossary data: label, whatItIs, whatItDoes, howItsUsed
    ├── package.json
    ├── vite.config.ts            # Vite config: React plugin, @/ alias, /api proxy
    └── tailwind.config.js        # Clay design token definitions
```

---

## 5. How to Run Locally

### Prerequisites

- Python 3.11 or later
- Node.js 18 or later
- PostgreSQL 14 or later (running locally)

### Step 1: Create the database

```bash
createdb portfolio_analytics
```

### Step 2: Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/portfolio_analytics
# CORS_ORIGINS=http://localhost:5173
# RISK_FREE_RATE=0.045
# REFRESH_TOKEN=your-secret-token-here

python seed.py        # Creates all tables and populates demo data (first run only)
uvicorn app.main:app --reload --port 8000
```

### Step 2b: Refresh prices manually (optional)

After seeding, you can pull live end-of-day closes from Yahoo Finance:

```bash
# From the backend/ directory with the virtual environment active:
python refresh_prices.py

# Refresh only one portfolio:
python refresh_prices.py --portfolio-id 1

# Backfill 90 days of history instead of the default 365:
python refresh_prices.py --backfill-days 90
```

The script calls `refresh_service.refresh_all()` directly. It upserts new close prices, recomputes `portfolio_returns`, and updates `holdings.weight` and `holdings.market_value`. It is idempotent — running it twice for the same date range produces the same result.

The API will be available at `http://localhost:8000`. Interactive API docs are at `http://localhost:8000/docs`.

### Step 3: Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. Vite's dev server is configured to proxy all requests to `/api/*` to `http://localhost:8000`, so no CORS issues arise during local development. The proxy configuration lives in `frontend/vite.config.ts`:

```ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
},
```

In production, the frontend reads `VITE_API_BASE_URL` from the environment (e.g., `https://your-backend.koyeb.app/api`) to route API calls directly to the deployed server.

---

## 6. How to Deploy

### Database: Koyeb Managed PostgreSQL

1. Log in to [koyeb.com](https://www.koyeb.com), go to **Databases**, and click **Create Database Service**.
2. Choose a region (e.g., `was` for US East). Once provisioned, copy the connection string.

### Backend: Koyeb Web Service

1. In the Koyeb dashboard, click **Create Service** → **Web Service** → **GitHub**.
2. Set **Work directory** to `backend` and **Run command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Add environment variables:
   - `DATABASE_URL` — the Koyeb PostgreSQL connection string
   - `CORS_ORIGINS` — your Vercel frontend URL, e.g. `https://your-app.vercel.app`
   - `RISK_FREE_RATE` — `0.045`
   - `REFRESH_TOKEN` — a secret string that the admin endpoint and GitHub Actions will use for authorization
   - `MARKET_DATA_PROVIDER` — `yfinance` (default; leave blank to use the default)
   - `BACKFILL_DAYS` — `365` (default; reduce to e.g. `90` for faster first-run seeding)
4. Deploy. After the service is live, open the Koyeb console and run `python seed.py` to seed the database.

Note: Koyeb's free tier puts services to sleep after inactivity. The first request after a cold start may take several seconds while the container wakes up.

### Configure live data (GitHub Actions)

To automate nightly price refreshes and keepalive pings, add two secrets to your GitHub repository under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `BACKEND_URL` | Your Koyeb backend URL, e.g. `https://your-backend-app.koyeb.app` |
| `REFRESH_TOKEN` | The same token you set in the Koyeb environment variables |

Once the secrets are in place, push to `main` to activate the two workflows:

- **`.github/workflows/refresh-prices.yml`** — Runs at `0 23 * * *` UTC every night. Posts to `/api/admin/refresh-prices` with an `X-Refresh-Token` header. The backend fetches new end-of-day closes from Yahoo Finance, updates the `prices` table, and recomputes returns.
- **`.github/workflows/keepalive.yml`** — Runs every 10 minutes (`*/10 * * * *`). Gets `/api/health/keepalive` to prevent Koyeb from sleeping the service between user sessions.

### Frontend: Vercel

1. Go to [vercel.com](https://vercel.com), click **Add New Project**, and import your repository.
2. Set **Root Directory** to `frontend`, **Framework Preset** to Vite, **Build Command** to `npm run build`, **Output Directory** to `dist`.
3. Add one environment variable: `VITE_API_BASE_URL` = `https://your-backend-app.koyeb.app/api`.
4. Deploy.

---

## 7. Backend Deep-Dive

### `app/main.py`

Entry point for the FastAPI application. It instantiates the `FastAPI` app with a title and version, attaches `CORSMiddleware` using the list of origins parsed from `config.py`, and mounts the portfolios router at the `/api` prefix. It also defines a simple `GET /api/health` endpoint that returns `{"status": "healthy"}` for uptime monitoring.

### `app/config.py`

Uses `pydantic-settings`'s `BaseSettings` to load configuration from environment variables or a `.env` file. Three settings are defined:

- `database_url` — PostgreSQL connection string, defaulting to `localhost/portfolio_analytics`.
- `cors_origins` — comma-separated list of allowed origins; the `cors_origin_list` property splits it into a Python list.
- `risk_free_rate` — the annual risk-free rate used in Sharpe ratio calculations; defaults to `0.045` (4.5%).

`get_settings()` is decorated with `@lru_cache` so it only reads the `.env` file once per process.

### `app/database.py`

Sets up SQLAlchemy. It normalizes any `postgres://` connection strings to `postgresql://` (Heroku/Koyeb sometimes uses the old prefix), creates the engine with `pool_pre_ping=True` (checks connection health before using it), and defines `SessionLocal`. The `get_db()` generator function is a FastAPI dependency that opens a session for each request and closes it when the request finishes, even if an exception is raised.

---

### `models/models.py` — All 8 Database Models

#### `Portfolio`

The central table. Each row is one managed portfolio.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | Auto-incremented |
| `name` | String(200) | Display name, e.g. "Growth Equity Portfolio" |
| `strategy` | String(100) | Investment strategy label |
| `benchmark_id` | Integer FK → benchmarks | Optional benchmark linkage |
| `inception_date` | Date | Start date for "Since Inception" calculations |
| `currency` | String(10) | Reporting currency, default "CAD" |
| `description` | Text | Optional long-form description |
| `created_at`, `updated_at` | DateTime | Audit timestamps |

Relationships: `benchmark` (many-to-one), `holdings`, `returns`, `transactions` (all one-to-many with `lazy="dynamic"` for large datasets).

#### `Benchmark`

Reference table for index benchmarks.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | Auto-incremented |
| `name` | String(200) | Full name, e.g. "S&P 500 Index" |
| `ticker` | String(50) | Unique ticker, e.g. "^GSPC" |

Four benchmarks are seeded: S&P/TSX Composite (`^GSPTSE`), S&P 500 (`^GSPC`), FTSE Canada Universe Bond (`XBB.TO`), MSCI World (`URTH`).

#### `Security`

Represents a single tradable instrument.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | Auto-incremented |
| `ticker` | String(20) | Unique; indexed for fast lookups |
| `name` | String(200) | Full company name |
| `sector` | String(100) | e.g. "Financials", "Technology" |
| `asset_class` | String(50) | e.g. "Canadian Equity", "Fixed Income" |
| `currency` | String(10) | Pricing currency |
| `exchange` | String(50) | Exchange code, e.g. "TSX", "NASDAQ" |

34 securities are seeded across Canadian equities, US equities, fixed income ETFs, and alternatives.

#### `Holding`

A point-in-time snapshot of one position in one portfolio on one date. Holdings are recorded for every Friday, the last trading day of each month, and the first/last trading day overall.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `portfolio_id` | FK → portfolios | |
| `security_id` | FK → securities | |
| `date` | Date | Snapshot date; indexed |
| `quantity` | Numeric(18, 4) | Number of shares/units held |
| `market_value` | Numeric(18, 2) | Dollar value at that date |
| `weight` | Numeric(8, 6) | Fraction of total portfolio (0.0 to 1.0) |
| `target_weight` | Numeric(8, 6) | Intended strategy weight |
| `cost_basis` | Numeric(18, 2) | Original purchase value |

Composite index on `(portfolio_id, date)` for fast date-filtered queries.

#### `Price`

Daily OHLC data for each security (open and close prices, volume).

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `security_id` | FK → securities | |
| `date` | Date | Trading date; indexed |
| `close_price` | Numeric(12, 4) | End-of-day price |
| `open_price` | Numeric(12, 4) | Opening price |
| `volume` | BigInteger | Simulated trade volume |

Composite index on `(security_id, date)`.

#### `PortfolioReturn`

Precomputed daily return series for each portfolio.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `portfolio_id` | FK → portfolios | |
| `date` | Date | |
| `daily_return` | Numeric(12, 8) | Single-day return as a decimal (e.g., 0.0012) |
| `cumulative_return` | Numeric(12, 8) | Compound return from inception |
| `market_value` | Numeric(18, 2) | Total portfolio value that day |

Composite index on `(portfolio_id, date)`.

#### `BenchmarkReturn`

Same structure as `PortfolioReturn` but for benchmark indices.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `benchmark_id` | FK → benchmarks | |
| `date` | Date | |
| `daily_return` | Numeric(12, 8) | |
| `cumulative_return` | Numeric(12, 8) | |

Composite index on `(benchmark_id, date)`.

#### `Transaction`

Buy, sell, and dividend records.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `portfolio_id` | FK → portfolios | |
| `security_id` | FK → securities | |
| `date` | Date | Transaction date |
| `transaction_type` | String(20) | "buy", "sell", or "dividend" |
| `quantity` | Numeric(18, 4) | Shares transacted |
| `price` | Numeric(12, 4) | Price per share |
| `amount` | Numeric(18, 2) | Total dollar amount |

Composite index on `(portfolio_id, date)`.

---

### `schemas/schemas.py` — Pydantic Response Models

Pydantic models define the exact JSON shape returned by each endpoint. All use `from_attributes = True` where ORM conversion is needed.

| Schema | Used by | Key fields |
|---|---|---|
| `PortfolioBase` | List portfolios, embedded in summary | id, name, strategy, currency, inception_date, benchmark_name |
| `PortfolioSummary` | `/summary` | All above plus: total_market_value, daily_return, cumulative_return, annualized_return, volatility, sharpe_ratio, max_drawdown, tracking_error, information_ratio, top_positions |
| `HoldingItem` | Holdings, top positions | ticker, name, sector, asset_class, weight, market_value, quantity, target_weight, weight_drift, return_contribution, cost_basis |
| `HoldingsResponse` | `/holdings` | portfolio_id, as_of_date, total_market_value, holdings list |
| `PerformancePoint` | Embedded in time series | date, portfolio_return, benchmark_return, excess_return |
| `PerformanceResponse` | `/performance` | period, start/end dates, cumulative/annualized returns (portfolio + benchmark + excess), series |
| `SectorAllocation` / `SectorAllocationResponse` | `/sector-allocation` | Sector name, weight, market_value, optional benchmark_weight |
| `AssetAllocation` / `AssetAllocationResponse` | `/asset-allocation` | Asset class name, weight, market_value |
| `SecurityAttribution` | Embedded in attribution | ticker, name, sector, weight, return_contribution |
| `SectorAttribution` | Embedded in attribution | sector, portfolio_weight, benchmark_weight, portfolio_contribution, benchmark_contribution, allocation_effect, selection_effect, total_effect |
| `AttributionResponse` | `/attribution` | period, dates, total_return, benchmark_return, excess_return, by_security, by_sector, best_contributors, worst_contributors |
| `BenchmarkComparisonResponse` | `/benchmark-comparison` | benchmark_name, portfolio_cumulative, benchmark_cumulative, excess_return, tracking_error, information_ratio, series |
| `RollingVolatilityPoint` | Embedded in risk | date, vol_30d, vol_90d, benchmark_vol_30d, benchmark_vol_90d |
| `DrawdownPoint` | Embedded in risk | date, drawdown, benchmark_drawdown |
| `RiskMetricsResponse` | `/risk-metrics` | volatility, sharpe_ratio, max_drawdown (with start/end dates), var_95, cvar_95, beta, tracking_error, information_ratio, rolling_volatility series, drawdown_series |

`DateRangeParams` is a helper model used to validate `period`, `start_date`, and `end_date` query parameters. The `period` field is validated against the regex `^(1M|3M|6M|YTD|1Y|SI)$`.

---

### `routes/portfolios.py` — Every Endpoint

All routes are registered under the prefix `/api/portfolios` (from `portfolios_router`) and `/api` from `main.py`, giving full paths of `/api/portfolios/...`.

| Method | Path | Query params | Response schema | Description |
|---|---|---|---|---|
| GET | `/api/health` | — | `{"status": "healthy"}` | Uptime check |
| GET | `/api/portfolios` | — | `list[PortfolioBase]` | All portfolios with benchmark names |
| GET | `/api/portfolios/{id}/summary` | period, start_date, end_date | `PortfolioSummary` | KPIs for the dashboard overview |
| GET | `/api/portfolios/{id}/holdings` | as_of_date, sector, asset_class, search | `HoldingsResponse` | All holdings; server-side filtered |
| GET | `/api/portfolios/{id}/performance` | period, start_date, end_date | `PerformanceResponse` | Daily return series + period totals |
| GET | `/api/portfolios/{id}/sector-allocation` | as_of_date | `SectorAllocationResponse` | Portfolio weights grouped by sector |
| GET | `/api/portfolios/{id}/asset-allocation` | as_of_date | `AssetAllocationResponse` | Portfolio weights grouped by asset class |
| GET | `/api/portfolios/{id}/attribution` | period, start_date, end_date | `AttributionResponse` | Return attribution by security and sector |
| GET | `/api/portfolios/{id}/benchmark-comparison` | period, start_date, end_date | `BenchmarkComparisonResponse` | Side-by-side portfolio vs benchmark analytics |
| GET | `/api/portfolios/{id}/risk-metrics` | period, start_date, end_date | `RiskMetricsResponse` | Full risk metric set + rolling series |

All period-based endpoints accept an optional `period` shortcode (e.g., `?period=YTD`) or explicit `start_date`/`end_date` parameters. If neither is provided, the service defaults to the portfolio's inception date as the start.

Every endpoint is protected by a try/except block that converts `ValueError` (raised when a portfolio is not found) into a 404 HTTP response.

---

### `services/portfolio_service.py` — Service Functions

The service layer sits between the route handlers and the analytics module. It fetches records from PostgreSQL and calls the analytics functions to compute derived metrics.

**`resolve_date_range(inception_date, period, start_date, end_date)`**

Converts a period code into a concrete `(start, end)` date tuple. Uses `relativedelta` for calendar-aware month/year arithmetic. The effective start is always clamped to the inception date so no pre-portfolio data is requested.

**`list_portfolios(db)`**

Issues a `SELECT * FROM portfolios` query, then for each portfolio constructs a `PortfolioBase` with the benchmark name looked up via the ORM relationship. Returns a list.

**`get_portfolio_summary(db, portfolio_id, period, start_date, end_date)`**

1. Resolves the date range.
2. Queries `portfolio_returns` for that range, extracting daily return floats.
3. Calls `analytics.cumulative_return`, `annualized_return`, `annualized_volatility`, `sharpe_ratio`, and `max_drawdown` on the daily returns list.
4. If a benchmark is assigned, queries `benchmark_returns` for the same range and calls `tracking_error` and `information_ratio`.
5. Queries the top 5 holdings by market value as of the last return date.
6. Assembles and returns a `PortfolioSummary`.

**`get_holdings(db, portfolio_id, as_of_date, sector, asset_class, search)`**

Finds the most recent holdings date (or uses the supplied `as_of_date`), then queries `holdings` joined to `securities` with server-side filters for sector, asset class, and ILIKE search on ticker/name. Computes `weight_drift = actual_weight - target_weight` for each holding.

**`get_performance(db, portfolio_id, period, start_date, end_date)`**

Queries portfolio and benchmark daily returns for the period, then computes running cumulative returns (using the chain-link formula `(1+cumulative)*(1+daily)-1`) for both. Builds a `PerformancePoint` series and computes summary totals.

**`get_sector_allocation(db, portfolio_id, as_of_date)`**

Queries holdings as of the most recent (or specified) date, grouped by `security.sector`, summing `weight` and `market_value`. Returns the rolled-up `SectorAllocationResponse`.

**`get_asset_allocation(db, portfolio_id, as_of_date)`**

Same as sector allocation but grouped by `security.asset_class`.

**`get_attribution(db, portfolio_id, period, start_date, end_date)`**

1. Fetches holdings at period start and end.
2. For each holding at period end, looks up the security's start and end prices from the `prices` table.
3. Computes security return as `(end_price / start_price) - 1` and contribution as `weight * security_return`.
4. Aggregates contributions by sector.
5. Identifies the top 5 and bottom 5 contributors.

**`get_benchmark_comparison(db, portfolio_id, period, start_date, end_date)`**

Fetches both portfolio and benchmark return series, computes cumulative returns for each, calls `tracking_error` and `information_ratio`, and builds the comparison response.

**`get_risk_metrics(db, portfolio_id, period, start_date, end_date)`**

Fetches portfolio daily returns, then calls the full set of risk analytics functions. If a benchmark is present, also computes benchmark rolling volatility and drawdown for the chart overlays.

---

### `services/analytics.py` — Every Analytics Function

This module contains pure Python/NumPy financial math. All return values are decimals (e.g., `0.05` = 5%, not `5`).

**`cumulative_return(daily_returns)`**

Formula: `product(1 + r for r in daily_returns) - 1` using `numpy.prod`.

What it tells you: the total percentage gain or loss over a period, compounding each day's return on top of the previous. If you earned 1% per day for 5 days, you did not earn exactly 5%—you earned slightly more because each day's gain is on a larger base.

**`annualized_return(cumulative_ret, num_days)`**

Formula: `(1 + cumulative_ret)^(252/num_days) - 1`. Assumes 252 trading days per year.

What it tells you: what the equivalent yearly return would be, regardless of how long the period was. Makes a 2-month return comparable to a 2-year return on the same scale.

**`annualized_volatility(daily_returns)`**

Formula: `std(daily_returns, ddof=1) * sqrt(252)`.

What it tells you: how much the portfolio's value typically fluctuates in a year. Higher values mean a wilder ride. Uses sample standard deviation (`ddof=1`).

**`sharpe_ratio(daily_returns, risk_free_rate=0.045)`**

Formula: `(annualized_return - risk_free_rate) / annualized_volatility`.

What it tells you: how much return you got per unit of risk taken. The risk-free rate (4.5% by default, representing a safe Treasury/GIC return) is subtracted because any investment should first exceed the "free" return before claiming skill. A Sharpe above 1.0 is generally considered good.

**`max_drawdown(daily_returns)`**

Returns `(max_dd, peak_idx, trough_idx)`.

Formula: computes the cumulative wealth index, then at each point measures the decline from the running maximum: `(cumulative[i] / running_max[i]) - 1`. The maximum of these negative values (i.e., the largest drop) is the max drawdown.

What it tells you: the worst peak-to-trough loss an investor would have experienced if they bought at the highest point and held through the lowest. The two index values let the service report the actual calendar dates of that drawdown episode.

**`rolling_volatility(daily_returns, window)`**

For each index `i`, computes `std(daily_returns[i-window+1 : i+1], ddof=1) * sqrt(252)`. Returns `None` for the first `window-1` positions where there is not enough history.

What it tells you: how risk has changed over time. A spike in 30-day rolling vol means the portfolio became much more turbulent over recent weeks.

**`drawdown_series(daily_returns)`**

Like `max_drawdown` but returns the full array of drawdown values at each date, not just the maximum. Used for the drawdown area chart.

**`tracking_error(portfolio_returns, benchmark_returns)`**

Formula: `std(portfolio_returns - benchmark_returns, ddof=1) * sqrt(252)`.

What it tells you: how consistently the portfolio deviates from its benchmark. A low tracking error means the portfolio closely mirrors the benchmark; a high one means it is taking large independent bets.

**`information_ratio(portfolio_returns, benchmark_returns)`**

Formula: `annualized_excess_return / tracking_error`, where `annualized_excess_return = annualized_return(p_cumulative) - annualized_return(b_cumulative)`.

What it tells you: whether the manager's outperformance is consistent. A high information ratio means the manager beats the benchmark reliably rather than by luck.

**`beta(portfolio_returns, benchmark_returns)`**

Formula: `Cov(Rp, Rb) / Var(Rb)` using `numpy.cov`.

What it tells you: how sensitive the portfolio is to the market. A beta of 1.2 means the portfolio tends to move 1.2% for every 1% move in the benchmark—amplified, both up and down.

**`value_at_risk(daily_returns, confidence=0.95)`**

Formula: `numpy.percentile(daily_returns, (1 - confidence) * 100)`.

What it tells you: on a typical bad day (the worst 5% of days), the portfolio's loss is at least this large. It is historical (empirical) VaR based on actual past returns, not a parametric assumption.

**`conditional_var(daily_returns, confidence=0.95)`**

Formula: the mean of all returns below the VaR threshold.

What it tells you: the average loss on the worst 5% of days—in other words, given that a bad day happens, how bad is it on average? CVaR is more informative than VaR because it describes the severity of losses beyond the threshold, not just the cutoff.

---

### `seed.py` — Data Generation

The seed script creates all tables from scratch (dropping any existing tables first) and populates them with realistic simulated data starting from January 3, 2023 through today.

**Benchmarks**: 4 records, one for each benchmark index.

**Benchmark returns**: For each benchmark, daily returns are drawn from a normal distribution parameterized by target annual return and volatility. For example, the S&P 500 benchmark uses a 10% annual return and 16% annual volatility. Returns are converted to daily scale using `annual / 252` for drift and `annual / sqrt(252)` for volatility.

**Securities**: 34 securities across four categories:
- 18 Canadian Equities (TSX-listed: RY.TO, TD.TO, ENB.TO, CNR.TO, SHOP.TO, BMO.TO, BNS.TO, SU.TO, TRP.TO, BCE.TO, T.TO, ABX.TO, FTS.TO, MFC.TO, NTR.TO, CSU.TO, GIB-A.TO, RCI-B.TO)
- 8 US Equities (AAPL, MSFT, AMZN, JNJ, JPM, PG, UNH, XOM)
- 4 Fixed Income ETFs (XBB.TO, ZAG.TO, XCB.TO, CLF.TO)
- 2 Alternatives (XRE.TO for REITs, GLD for gold)

**Prices**: Generated using Geometric Brownian Motion (GBM) for each security. Equities use 8% annual drift and 20% annual volatility; fixed income uses 3% drift and 4% volatility; alternatives use 6% drift and 12% volatility.

**Portfolios and returns**: For each of the 4 portfolio configurations, the seeder:
1. Creates the portfolio record.
2. Simulates daily returns as the weighted sum of each security's daily price return.
3. Every 20 trading days, applies small random weight perturbations (scaled by a `drift_factor`) to simulate natural portfolio drift, then renormalizes so weights still sum to 1.
4. Saves a `PortfolioReturn` record for every trading day.
5. Saves `Holding` snapshots on Fridays, last-day-of-month, and the first/last day of the entire period.

**Transactions**: 50 random buy/sell/dividend transactions are generated per portfolio, with random dates, securities, and quantities.

Note: As of v2, `seed.py` is used for first-run bootstrapping only. After the initial seed, prices are supplied by Yahoo Finance through `refresh_service`. The GBM generator is retained in `seed.py` for offline demos where network access is unavailable.

---

### `services/market_data.py` — Yahoo Finance Wrapper (v2)

Wraps the `yfinance` library with a module-level `cachetools.TTLCache(ttl=3600)` so repeated requests for the same ticker within an hour are served from memory rather than making redundant network calls.

**`fetch_history(ticker, start, end=None)`**

Downloads OHLCV data for the given ticker and date range. Returns a list of `(date, close_price)` tuples. If `end` is omitted, it defaults to today.

**`fetch_latest_close(ticker)`**

Returns the most recent available close price as a float. Used during the nightly refresh to update today's price row.

**`lookup_ticker(ticker)`**

Queries the Yahoo Finance metadata for a ticker and returns a dict containing the security name, sector, and exchange. Used by the `GET /api/securities/lookup` endpoint to pre-fill the "Add Holding" form in the UI.

---

### `services/refresh_service.py` — Price Refresh Orchestration (v2)

**`refresh_all(session, *, portfolio_id=None, backfill_days=365)`**

The main entry point for the nightly data pipeline. Accepts an optional `portfolio_id` to restrict the refresh to a single portfolio; omitting it refreshes all portfolios.

Steps performed:
1. Determines the set of securities to refresh (either all, or only those held by the specified portfolio).
2. For each security, calls `market_data.fetch_history` to retrieve up to `backfill_days` of close prices.
3. Upserts each close price into the `prices` table using `ON CONFLICT DO NOTHING` — rows that already exist are not overwritten, making the operation safe to re-run.
4. Carries forward the last known close on weekends and public holidays so the return series stays continuous.
5. Recomputes `portfolio_returns` (daily return, cumulative return, market value) for every portfolio affected.
6. Updates `holdings.weight` and `holdings.market_value` based on the refreshed prices.
7. Writes a timestamp to `backend/.last_refresh`.

Returns a summary dict: `{updated_securities, updated_returns_through, skipped, errors}`.

---

### `services/keepalive.py` — Liveness Probe (v2)

**`ping(session)`**

Executes a lightweight `SELECT 1` to verify the database connection is healthy, then reads `backend/.last_refresh` to report when prices were last updated. Returns `{ok: bool, db: str, last_refresh: str | null}`. Called by `GET /api/health/keepalive` and by the GitHub Actions keepalive workflow.

---

### `refresh_prices.py` — CLI Script (v2)

A standalone command-line script at `backend/refresh_prices.py`. Opens its own SQLAlchemy session and calls `refresh_service.refresh_all()` with arguments parsed from the command line.

```
python refresh_prices.py [--portfolio-id N] [--backfill-days N]
```

Intended uses: manual one-off refreshes during development, initial backfill after deployment, and as a fallback if the GitHub Actions cron job fails.

---

## 7b. Live Market Data Architecture (v2)

This section explains how end-of-day market prices flow from Yahoo Finance into the database and how the computed analytics are kept current.

### Data pipeline overview

```
Yahoo Finance (yfinance)
        |
        | market_data.fetch_history(ticker, start, end)
        | [TTLCache — 1 hour per ticker]
        v
  prices table (upsert, ON CONFLICT DO NOTHING)
        |
        | refresh_service.refresh_all()
        v
  portfolio_returns recomputed
  holdings.weight / market_value updated
        |
        | backend/.last_refresh written
        v
  keepalive.ping() reads last_refresh
  → GET /api/health/keepalive returns { ok, db, last_refresh }
```

### Price carry-forward

On weekends and public holidays, `refresh_service` carries the last known close forward to fill gaps. This prevents discontinuities in the return series that would produce misleading cumulative return charts.

### Trigger paths

There are three ways to invoke a refresh:

1. **Nightly GitHub Actions cron** (`0 23 * * *` UTC) — the primary production path. Posts to `POST /api/admin/refresh-prices` with the `X-Refresh-Token` header.
2. **CLI script** — `python refresh_prices.py` — used for development, backfills, and manual recovery.
3. **Admin API endpoint** — `POST /api/admin/refresh-prices` — can be called from any HTTP client (curl, Postman, etc.) with the `X-Refresh-Token` header.

### TTL cache

`market_data.py` wraps all yfinance calls in a `cachetools.TTLCache(ttl=3600)`. This means that if multiple refresh requests arrive within an hour (for example, a manual trigger shortly after a cron run), yfinance is only queried once per ticker per hour — reducing the risk of Yahoo Finance rate-limiting the backend.

---

## 8. Frontend Deep-Dive

### `main.tsx`

The React entry point. Renders `<Provider store={store}>` wrapping `<App />` inside `<React.StrictMode>`. The Redux store is provided at the root so every component in the tree can use `useAppSelector` and `useAppDispatch`. CSS is imported here via `import './index.css'`.

### `App.tsx`

Defines the route tree using React Router v6. `<BrowserRouter>` wraps all routes. One top-level `<Route element={<Layout />}>` acts as a persistent layout container. Five child routes are registered:

| Frontend path | Component |
|---|---|
| `/` | `Dashboard` |
| `/holdings` | `Holdings` |
| `/performance` | `Performance` |
| `/attribution` | `Attribution` |
| `/risk` | `RiskMetrics` |

The `<Layout />` component renders `<Outlet />` where child page components appear.

### `api/client.ts`

A minimal `fetch` wrapper. The `request<T>` function:
1. Builds a full URL from `BASE_URL` (defaults to `/api`, overridden by `VITE_API_BASE_URL`).
2. Appends query parameters, skipping any that are `undefined`, `null`, or empty strings.
3. Calls `fetch` and checks `response.ok`.
4. If not ok, parses the error body and throws an `ApiError` with the HTTP status code.
5. Otherwise, returns `response.json()` typed as `T`.

### `api/portfolioApi.ts`

A typed API client object exposing one method per backend endpoint. All methods call `api.get<ResponseType>(endpoint, params)`. Period-based methods use the shared `periodParams` helper to build a `{ period, start_date, end_date }` object, skipping undefined values. This is the only file that knows about URL paths—the rest of the frontend calls methods like `portfolioApi.getSummary(id, period)`.

### `store/store.ts`

Configures the Redux store with four reducers:

| Key | Reducer |
|---|---|
| `portfolio` | portfolioReducer (portfolioSlice) |
| `holdings` | holdingsReducer (holdingsSlice) |
| `analytics` | analyticsReducer (analyticsSlice) |
| `filters` | filterReducer (filterSlice) |

Exports `RootState` and `AppDispatch` types, plus `useAppDispatch` and `useAppSelector` as typed wrappers so consuming components never need to import `useSelector` or `useDispatch` directly.

### Redux Slices

**`portfolioSlice.ts`**

State: `{ list: Portfolio[], summary: PortfolioSummary | null, listLoading, summaryLoading, error }`.

Thunks: `fetchPortfolios` (calls `portfolioApi.listPortfolios()`) and `fetchPortfolioSummary({ id, period })` (calls `portfolioApi.getSummary(id, period)`).

**`holdingsSlice.ts`**

State: `{ data: HoldingsResponse | null, loading, error }`.

Thunk: `fetchHoldings({ id, as_of_date?, sector?, asset_class?, search? })`.

**`analyticsSlice.ts`**

State: `{ performance, sectorAllocation, assetAllocation, attribution, benchmarkComparison, riskMetrics, loading: Record<string, boolean>, error }`.

Thunks (6): `fetchPerformance`, `fetchSectorAllocation`, `fetchAssetAllocation`, `fetchAttribution`, `fetchBenchmarkComparison`, `fetchRiskMetrics`. Each thunk tracks its own loading key in `state.loading` (e.g., `state.loading.performance`), enabling per-chart skeleton states.

**`filterSlice.ts`**

State: `{ selectedPortfolioId: number | null, period: TimePeriod, sectorFilter, assetClassFilter, searchQuery }`.

Synchronous action creators: `setSelectedPortfolio`, `setPeriod`, `setSectorFilter`, `setAssetClassFilter`, `setSearchQuery`. The initial period defaults to `'YTD'`.

---

### Modal Components (v2) — `components/modals/`

Four new components power the holdings editor. They share a claymorphism surface style (rounded corners, layered `shadow-clay-lg`, `bg-clay-surface`) that matches the rest of the design system.

**`Modal.tsx`**

A generic, accessible modal wrapper. Renders a semi-transparent backdrop and a centered content container. Traps focus when open, closes on `Escape` key press and backdrop click. Accepts `isOpen`, `onClose`, and `children` props. All other modals are composed on top of this primitive.

**`PortfolioFormModal.tsx`**

Used for both creating and editing a portfolio. In create mode, presents empty fields. In edit mode, pre-populates from the existing `Portfolio` object passed as a prop. On submit, dispatches either `createPortfolio` or `updatePortfolio` thunk depending on whether `portfolioId` is provided. After a successful mutation, refreshes the portfolio list.

**`HoldingFormModal.tsx`**

Used for both adding and editing a holding within a portfolio. The "Ticker" field calls the `lookupTicker` Redux thunk on blur, which hits `GET /api/securities/lookup?ticker=` to auto-fill the security name, sector, and exchange. On submit, dispatches `addHolding` or `updateHolding`. After a successful mutation, re-fetches the holdings list.

**`ConfirmDialog.tsx`**

A lightweight confirmation prompt (built on `Modal`) used for destructive actions such as deleting a portfolio or removing a holding. Accepts `message`, `onConfirm`, and `onCancel` props. The confirm button is styled with `clay-coral` to signal danger.

---

### New Redux Thunks (v2)

Seven new async thunks have been added across the `portfolioSlice` and `holdingsSlice` to support the editor:

| Thunk | Slice | API call |
|---|---|---|
| `createPortfolio` | `portfolioSlice` | `POST /api/portfolios` |
| `updatePortfolio` | `portfolioSlice` | `PUT /api/portfolios/{id}` |
| `deletePortfolio` | `portfolioSlice` | `DELETE /api/portfolios/{id}` |
| `addHolding` | `holdingsSlice` | `POST /api/portfolios/{id}/holdings` |
| `updateHolding` | `holdingsSlice` | `PUT /api/portfolios/{id}/holdings/{security_id}` |
| `deleteHolding` | `holdingsSlice` | `DELETE /api/portfolios/{id}/holdings/{security_id}` |
| `lookupTicker` | `holdingsSlice` | `GET /api/securities/lookup?ticker=` |

---

### Editor Buttons in the UI (v2)

**Header** — A "+ New Portfolio" button opens `PortfolioFormModal` in create mode. For the currently selected portfolio, a pencil icon opens the modal in edit mode, and a trash icon opens `ConfirmDialog` before dispatching `deletePortfolio`.

**Holdings page** — An "+ Add Holding" button at the top of the holdings table opens `HoldingFormModal` in add mode. Each row in the table gains a pencil icon and a trash icon for inline edit and delete actions.

### `types/index.ts`

TypeScript interfaces that mirror the Pydantic response schemas exactly. Key types: `Portfolio`, `HoldingItem`, `PortfolioSummary`, `HoldingsResponse`, `PerformancePoint`, `PerformanceResponse`, `SectorAllocationResponse`, `AssetAllocationResponse`, `SecurityAttribution`, `SectorAttribution`, `AttributionResponse`, `BenchmarkComparisonResponse`, `RollingVolatilityPoint`, `DrawdownPoint`, `RiskMetricsResponse`. The `TimePeriod` union type (`'1M' | '3M' | '6M' | 'YTD' | '1Y' | 'SI'`) constrains the period selector.

### `utils/format.ts`

Formatting helpers used throughout pages and components:

- `formatCurrency(value, currency)` — full dollar amount using `Intl.NumberFormat`, e.g. `$1,234,567`.
- `formatCurrencyCompact(value, currency)` — abbreviated: `$1.2B`, `$150.0M`, `$3.4K`.
- `formatPercent(value, decimals)` — multiplies by 100 and appends `%`, e.g. `12.34%`.
- `formatBps(value)` — converts decimal to basis points, e.g. `50 bps`.
- `formatNumber(value, decimals)` — locale-formatted number.
- `formatDate(dateStr)` — parses an ISO date string and formats as `"May 15, 2025"`.
- `formatDateShort(dateStr)` — short form: `"May 15"`, used in chart axis labels.
- `signColor(value)` — returns a Tailwind class: `text-emerald-600` for positive, `text-red-600` for negative.
- `signColorBg(value)` — same but for badge backgrounds.

### `utils/csv.ts`

The `downloadCsv(filename, headers, rows)` function assembles a CSV string from a header array and a 2D array of cell values, wraps values containing commas or quotes in double quotes, creates a `Blob`, triggers a temporary anchor element click, and revokes the URL. Used by `DataTable` when the Export CSV button is clicked.

### `utils/glossary.ts`

The full glossary data store. Each entry has four fields: `label`, `whatItIs`, `whatItDoes`, `howItsUsed`. The `glossary` object is keyed by camelCase `TermKey` values (e.g., `sharpeRatio`, `maxDrawdown`, `cumulativeReturn`). The `TermKey` type is derived automatically from the object keys via `keyof typeof glossary`, so adding a new term auto-extends the type.

---

### Layout Components

**`Layout.tsx`**

The persistent shell. Renders `<Sidebar />` (fixed, left), a right content area with `<Header />` (sticky top), and `<main>` containing `<Outlet />`. Uses the class `min-h-screen bg-clay-bg` and adds `pl-72` to the content area to leave space for the 288px sidebar.

**`Sidebar.tsx`**

Fixed left navigation rendered as an `<aside>`. Contains a logo block, a navigation section with five `<NavLink>` items using Lucide icons, and a "Demo data" pill at the bottom. Active links receive `bg-clay-primarySoft` and `shadow-clay-sm` styling. The `end` prop on the root `/` link prevents it from matching all child routes.

**`Header.tsx`**

Sticky top bar. On mount it dispatches `fetchPortfolios()` via `useEffect`. A second `useEffect` auto-selects the first portfolio if none is selected. Renders a `<select>` for portfolio switching, a strategy pill and benchmark label, and the `<PeriodSelector>` component. Dispatches `setSelectedPortfolio` and `setPeriod` on user interaction.

---

### Common Components

**`KPICard.tsx`**

Displays a single key metric. Props: `label`, `value` (formatted string), optional `subValue`, optional `change` (decimal used to show a colored trend pill), optional `changeLabel`. Uses the `clay-card-sm` class. Numbers render in `font-mono` for alignment. The trend pill is green/mint for positive, red/coral for negative, amber/honey for zero.

**`DataTable.tsx`**

A generic `DataTable<T>` component backed by local `useState` for sort state. Each column is defined by a `Column<T>` descriptor: `key`, `header`, `accessor` (extracts a sortable primitive for sorting), optional `render` (returns JSX for display), and optional `align`. Clicking a column header cycles through ascending → descending → unsorted. If `exportFilename` is provided, an "Export CSV" button appears that calls `downloadCsv`. The component wraps itself in `clay-card overflow-hidden`.

**`Term.tsx`**

An inline glossary popover component. Accepts a `termKey` (must be a valid `TermKey`) and renders the label text alongside a small `HelpCircle` icon. On hover (desktop) or tap (touch), a fixed-position popover appears showing the term's `whatItIs`, `whatItDoes`, and `howItsUsed` fields from the glossary. The popover intelligently flips above the trigger if it would overflow the bottom of the viewport, and shifts left if it would overflow the right edge. It handles `Escape` key and outside-click dismissal. `Term` is used throughout pages to annotate jargon terms (e.g., wrapping "Sharpe Ratio" or "Max Drawdown" labels).

**`PeriodSelector.tsx`**

A tab strip of period options (1M, 3M, 6M, YTD, 1Y, SI). The active period receives `clay-tab-active` styling. Calls `onChange(period)` on click.

**`LoadingSpinner.tsx`**, **`ErrorState.tsx`**, **`EmptyState.tsx`**

Utility components for loading, error, and empty data states. `SkeletonCard` and `SkeletonChart` export pulse-animated placeholder elements used while API calls are in flight.

---

### Chart Components

**`PerformanceChart.tsx`**

Recharts `AreaChart` showing cumulative return over time. The portfolio line is rendered as an area with a purple (`#7C6FE8`) gradient fill. The benchmark is a dashed sky-blue line (`#6FB3E8`) with no fill. An optional excess return line in mint (`#58C9A3`) appears when `showExcess` is true. Y-axis values are formatted as percentages.

**`AllocationChart.tsx`**

Recharts `PieChart` rendered as a donut (inner radius 68, outer radius 108). Each slice represents a sector or asset class. A color palette of 9 colors cycles through the data. Below the chart, pill-shaped legend items show the name and percentage.

**`ContributionChart.tsx`**

Recharts `BarChart` (vertical by default, horizontal layout available). Bars are colored mint green (`#58C9A3`) for positive contributions and coral red (`#F08A7E`) for negative. Data is sorted descending by value before rendering. Used for top contributors, bottom contributors, and sector attribution charts.

**`DrawdownChart.tsx`**

Recharts `AreaChart` showing the drawdown series as a shaded coral area, with an optional dashed gray benchmark drawdown overlay. Values are pre-multiplied by 100 for percentage display on the Y-axis.

**`VolatilityChart.tsx`**

Recharts `LineChart` with four possible lines: portfolio 30-day vol (solid purple), portfolio 90-day vol (solid sky blue), benchmark 30-day vol (dashed muted), and benchmark 90-day vol (not shown in current legend). `null` values for early periods (before enough history for the rolling window) are handled gracefully by Recharts.

---

### Pages

**`Dashboard.tsx`**

On mount (and when `selectedPortfolioId` or `period` changes), dispatches four thunks: `fetchPortfolioSummary`, `fetchPerformance`, `fetchSectorAllocation`, `fetchAssetAllocation`. Renders:
- 6 KPI cards: Total Market Value, Daily Return, Cumulative Return, Volatility, Sharpe Ratio, Max Drawdown.
- An optional second row (if tracking error is available): Annualized Return, Tracking Error, Information Ratio, Portfolio Health indicator.
- A 2-column row: `PerformanceChart` (portfolio vs benchmark) + Sector Allocation donut.
- A 2-column row: Asset Class Allocation donut + Top 5 Positions table.

The Portfolio Health card shows a colored dot (green/amber/red) and a label (Healthy/Monitor/At Risk) based on whether the Sharpe ratio exceeds 0.5 or 0.

**`Holdings.tsx`**

Dispatches `fetchHoldings` whenever the portfolio selection, or the local search/sector/asset-class filter state changes (filters live in local component state, not Redux). Displays a search input, two dropdown filters (sector, asset class), and a `DataTable<HoldingItem>` with columns: Ticker, Security Name, Sector, Asset Class, Weight, Target Weight, Drift, Market Value, Quantity. The Drift column is color-coded using `signColor`. The table has a CSV export filename of `holdings_{portfolio_id}_{as_of_date}.csv`.

**`Performance.tsx`**

Dispatches `fetchPerformance`, `fetchBenchmarkComparison`, and `fetchRiskMetrics` on mount and period change. Renders:
- 6 KPI cards: Cumulative Return, Annualized Return, Benchmark Return, Excess Return, Tracking Error, Information Ratio.
- A full-width `PerformanceChart` with portfolio, benchmark, and excess return lines.
- A 2-column row: `VolatilityChart` (30/90-day rolling volatility) + `DrawdownChart`.

**`Attribution.tsx`**

Dispatches `fetchAttribution`. Renders:
- 3 KPI cards: Total Portfolio Return, Benchmark Return, Excess Return.
- 2 `ContributionChart` components side by side: Top Contributors and Bottom Contributors (top/bottom 5 securities by return contribution).
- A full-width `ContributionChart` for sector-level contributions.
- A `DataTable<SectorAttribution>` with CSV export for sector-level detail.
- A `DataTable<SecurityAttribution>` with CSV export for security-level attribution.

**`RiskMetrics.tsx`**

Dispatches `fetchRiskMetrics`. Renders:
- 6 KPI cards: Annualized Volatility, Sharpe Ratio, Max Drawdown (with date range label), VaR 95%, CVaR 95%, Beta.
- An optional second row (if benchmark data available): Tracking Error, Information Ratio, Risk Assessment panel (Low/Moderate/High based on volatility thresholds), Concentration Alert (flags if beta > 1.2).
- A 2-column row: `VolatilityChart` + `DrawdownChart`.

---

## 9. Data Flow End-to-End

The following sequence traces the full journey from opening the dashboard to seeing data on screen.

```
Browser                   Redux/React              FastAPI              PostgreSQL
   |                          |                       |                     |
   |-- navigate to "/"        |                       |                     |
   |                          |                       |                     |
   |   Layout mounts          |                       |                     |
   |   Header mounts -------->|                       |                     |
   |                          |-- dispatch            |                     |
   |                          |   fetchPortfolios()   |                     |
   |                          |-- GET /api/portfolios ->                    |
   |                          |                       |-- SELECT portfolios,|
   |                          |                       |   benchmarks        |
   |                          |                       |<-- rows ------------|
   |                          |<-- JSON list ---------|                     |
   |                          |                       |                     |
   |   re-render dropdown     |                       |                     |
   |   auto-select portfolio1 |                       |                     |
   |                          |-- dispatch            |                     |
   |                          |   setSelectedPortfolio(1)                   |
   |                          |                       |                     |
   |   Dashboard mounts       |                       |                     |
   |   useEffect fires ------>|                       |                     |
   |                          |-- dispatch fetchPortfolioSummary({id:1})    |
   |                          |-- dispatch fetchPerformance({id:1})         |
   |                          |-- dispatch fetchSectorAllocation({id:1})    |
   |                          |-- dispatch fetchAssetAllocation({id:1})     |
   |                          |                       |                     |
   |                          |-- GET /api/portfolios/1/summary?period=YTD  |
   |                          |                       |-- SELECT portfolio  |
   |                          |                       |-- SELECT returns    |
   |                          |                       |-- analytics.sharpe_|
   |                          |                       |   ratio(daily_rets) |
   |                          |                       |-- SELECT top 5 hldg |
   |                          |<-- JSON PortfolioSummary ------------------|
   |                          |                       |                     |
   |                          |-- fulfilled, store summary                  |
   |                          |                       |                     |
   |   KPI cards render       |                       |                     |
   |   (Total MV, Sharpe, …)  |                       |                     |
   |                          |                       |                     |
   |   ...performance, sector,|                       |                     |
   |   asset responses arrive |                       |                     |
   |   (in parallel) -------->|                       |                     |
   |                          |                       |                     |
   |   Charts render          |                       |                     |
```

When the user changes the period (e.g., from YTD to 1Y), the `Header` dispatches `setPeriod('1Y')`. The filter slice updates, which triggers `useEffect` hooks in Dashboard, Performance, Attribution, and RiskMetrics pages (any that are currently mounted), re-dispatching their respective thunks with the new period. The API re-runs its analytics calculations for the new date range and returns fresh results.

---

## 9b. Automation & Keepalive (v2)

Two GitHub Actions workflows keep the live deployment healthy and the price data current.

### `refresh-prices.yml` — Nightly Price Refresh

**Schedule:** `0 23 * * *` (23:00 UTC, daily)

**What it does:** Sends `POST /api/admin/refresh-prices` with an `X-Refresh-Token: ${{ secrets.REFRESH_TOKEN }}` header. The backend validates the token, then calls `refresh_service.refresh_all()`, which fetches new end-of-day closes from Yahoo Finance and updates the database.

**Required secrets:**
- `BACKEND_URL` — the base URL of the deployed backend (no trailing slash)
- `REFRESH_TOKEN` — must match the `REFRESH_TOKEN` env var set on the Koyeb service

**Recovery:** If Yahoo Finance temporarily blocks the request (rate limit or ticker delisted), the refresh returns a non-empty `errors` list but does not fail catastrophically. Previously fetched prices are retained. See Troubleshooting for mitigation steps.

### `keepalive.yml` — Backend Warm Ping

**Schedule:** `*/10 * * * *` (every 10 minutes)

**What it does:** Sends `GET /api/health/keepalive`. The backend executes `SELECT 1` to confirm the database is reachable and reads `backend/.last_refresh` to report the last successful price update. A healthy response looks like:

```json
{ "ok": true, "db": "ok", "last_refresh": "2026-05-17T23:01:42Z" }
```

**Purpose:** Koyeb's free Eco tier suspends services after a period of inactivity. By pinging every 10 minutes, the container stays warm and first-load latency for real users stays under one second.

**Cost note:** GitHub Actions includes 2,000 free minutes per month for public repositories. A 10-minute keepalive cron running continuously consumes approximately 4,320 minutes/month — exceeding the free tier for private repos. If CI minutes are a concern, raise the interval to `*/15` (2,880 minutes/month) or `*/20` (2,160 minutes/month). See Troubleshooting.

---

## 10. Routes and Endpoints Reference

### Backend API Endpoints

| Method | Path | Filters | Description |
|---|---|---|---|
| GET | `/api/health` | — | Returns `{"status":"healthy"}` |
| GET | `/api/portfolios` | — | All portfolios with benchmark names |
| GET | `/api/portfolios/{id}/summary` | period, start_date, end_date | KPIs: returns, volatility, Sharpe, drawdown |
| GET | `/api/portfolios/{id}/holdings` | as_of_date, sector, asset_class, search | Holdings with drift and cost basis |
| GET | `/api/portfolios/{id}/performance` | period, start_date, end_date | Daily return series + period totals |
| GET | `/api/portfolios/{id}/sector-allocation` | as_of_date | Sector weights |
| GET | `/api/portfolios/{id}/asset-allocation` | as_of_date | Asset class weights |
| GET | `/api/portfolios/{id}/attribution` | period, start_date, end_date | Security + sector return attribution |
| GET | `/api/portfolios/{id}/benchmark-comparison` | period, start_date, end_date | Side-by-side cumulative returns + TE/IR |
| GET | `/api/portfolios/{id}/risk-metrics` | period, start_date, end_date | Full risk set + time series |
| GET | `/api/health/keepalive` | — | Liveness + last refresh timestamp |
| POST | `/api/portfolios` | body: name, strategy, benchmark_id, currency | Create a new portfolio |
| PUT | `/api/portfolios/{id}` | body: partial portfolio fields | Update portfolio metadata |
| DELETE | `/api/portfolios/{id}` | — | Delete portfolio and its holdings |
| GET | `/api/securities` | — | List all securities |
| GET | `/api/securities/lookup` | `?ticker=AAPL` | Look up ticker metadata via yfinance |
| POST | `/api/securities` | body: ticker, name, sector, asset_class | Add a new security |
| POST | `/api/portfolios/{id}/holdings` | body: security_id, quantity | Add a holding |
| PUT | `/api/portfolios/{id}/holdings/{security_id}` | body: quantity, target_weight | Update a holding |
| DELETE | `/api/portfolios/{id}/holdings/{security_id}` | — | Remove a holding |
| POST | `/api/admin/refresh-prices` | header: `X-Refresh-Token` | Trigger price refresh |

### Frontend Routes

| Path | Component | Data fetched |
|---|---|---|
| `/` | Dashboard | summary, performance, sectorAllocation, assetAllocation |
| `/holdings` | Holdings | holdings |
| `/performance` | Performance | performance, benchmarkComparison, riskMetrics |
| `/attribution` | Attribution | attribution |
| `/risk` | RiskMetrics | riskMetrics |

---

## 11. Database Schema

```
portfolios
  id (PK), name, strategy, benchmark_id (FK→benchmarks), inception_date,
  currency, description, created_at, updated_at

benchmarks
  id (PK), name, ticker (UNIQUE)

securities
  id (PK), ticker (UNIQUE, IDX), name, sector, asset_class, currency, exchange

holdings                                   IDX: (portfolio_id, date)
  id (PK), portfolio_id (FK), security_id (FK), date (IDX),
  quantity, market_value, weight, target_weight, cost_basis

prices                                     IDX: (security_id, date)
  id (PK), security_id (FK), date (IDX), close_price, open_price, volume

portfolio_returns                          IDX: (portfolio_id, date)
  id (PK), portfolio_id (FK), date (IDX),
  daily_return, cumulative_return, market_value

benchmark_returns                          IDX: (benchmark_id, date)
  id (PK), benchmark_id (FK), date (IDX),
  daily_return, cumulative_return

transactions                               IDX: (portfolio_id, date)
  id (PK), portfolio_id (FK), security_id (FK), date (IDX),
  transaction_type, quantity, price, amount
```

**Foreign key relationships:**

- `portfolios.benchmark_id` → `benchmarks.id`
- `holdings.portfolio_id` → `portfolios.id`
- `holdings.security_id` → `securities.id`
- `prices.security_id` → `securities.id`
- `portfolio_returns.portfolio_id` → `portfolios.id`
- `benchmark_returns.benchmark_id` → `benchmarks.id`
- `transactions.portfolio_id` → `portfolios.id`
- `transactions.security_id` → `securities.id`

---

## 12. State Management Map

| Slice | State keys | Exported thunks | Consumed by |
|---|---|---|---|
| `portfolio` | `list`, `summary`, `listLoading`, `summaryLoading`, `error` | `fetchPortfolios`, `fetchPortfolioSummary` | Header (list), Dashboard (summary) |
| `holdings` | `data`, `loading`, `error` | `fetchHoldings` | Holdings page |
| `analytics` | `performance`, `sectorAllocation`, `assetAllocation`, `attribution`, `benchmarkComparison`, `riskMetrics`, `loading` (map), `error` | `fetchPerformance`, `fetchSectorAllocation`, `fetchAssetAllocation`, `fetchAttribution`, `fetchBenchmarkComparison`, `fetchRiskMetrics` | Dashboard (performance, allocations), Performance (performance, benchmarkComparison, riskMetrics), Attribution (attribution), RiskMetrics (riskMetrics) |
| `filters` | `selectedPortfolioId`, `period`, `sectorFilter`, `assetClassFilter`, `searchQuery` | — (synchronous only) | Header (reads + writes portfolio + period), Dashboard (reads both), Holdings (reads portfolio, writes search/sector/assetClass locally), Performance, Attribution, RiskMetrics (read both) |

---

## 13. UI Design Language

The application uses a visual style called **claymorphism**: rounded surfaces with layered box shadows that simulate a soft, tactile, three-dimensional look—as if the cards are gently raised off the page.

### Color Palette (Tailwind `clay.*` tokens)

| Token | Hex | Role |
|---|---|---|
| `clay-bg` | `#F4EFE6` | Page background (warm off-white) |
| `clay-surface` | `#FFFFFF` | Card backgrounds |
| `clay-surface2` | `#FAF5EC` | Slightly warm secondary surface (table rows, inputs) |
| `clay-ink` | `#2D2A26` | Primary text |
| `clay-muted` | `#6B6358` | Secondary text |
| `clay-soft` | `#9C9388` | Placeholder / tertiary text |
| `clay-border` | `#E8E0D2` | Dividers and borders |
| `clay-primary` | `#7C6FE8` | Accent purple (buttons, active states) |
| `clay-primaryDeep` | `#5B4FCB` | Darker hover for primary |
| `clay-primarySoft` | `#E7E3FA` | Soft lavender background for active nav |
| `clay-mint` | `#58C9A3` | Positive/gain indicators |
| `clay-coral` | `#F08A7E` | Negative/loss indicators |
| `clay-honey` | `#F2C66B` | Warning / neutral |
| `clay-sky` | `#6FB3E8` | Benchmark lines, info accents |
| `clay-lavender` | `#C7BFF0` | Chart palette member |

### Shadow System

| Token | Usage |
|---|---|
| `shadow-clay-sm` | Small cards, pills |
| `shadow-clay` | Main cards |
| `shadow-clay-lg` | Tooltips, modals |
| `shadow-clay-inset` | Inputs, secondary cards (pressed in) |
| `shadow-clay-press` | Button press state |

### Border Radii

- `rounded-clay` = `1.25rem` (20px) — standard card corners
- `rounded-clay-lg` = `1.75rem` (28px) — larger cards
- `rounded-clay-xl` = `2.25rem` (36px) — extra large

### Key CSS Component Classes (`index.css`)

- `.clay-card` — main content card: `bg-clay-surface rounded-clay-lg shadow-clay p-6`
- `.clay-card-sm` — smaller card: `rounded-clay shadow-clay-sm p-4`
- `.clay-button` — primary CTA button: `rounded-full bg-clay-primary` with layered shadow
- `.clay-pill` — neutral tag badge
- `.clay-pill-mint` / `.clay-pill-coral` / `.clay-pill-honey` / `.clay-pill-sky` — colored status badges
- `.clay-input` / `.clay-select` — form controls with inset shadow

Typography uses **Plus Jakarta Sans** as the primary sans-serif and **JetBrains Mono** for numeric values in KPI cards and tables.

### Modal and dialog pattern (v2)

The `Modal` and `ConfirmDialog` components (in `components/modals/`) follow the same claymorphism language as the rest of the UI. The modal container uses `bg-clay-surface rounded-clay-xl shadow-clay-lg` to float above the dimmed backdrop, creating the same tactile raised-card feel as the dashboard panels. The `ConfirmDialog` danger button uses `.clay-pill-coral` coloring so destructive actions are visually distinct. Form inputs inside `PortfolioFormModal` and `HoldingFormModal` use `.clay-input` for the inset-shadow style consistent with the Holdings filter controls.

---

## 14. Plain-English Glossary

**AUM (Assets Under Management):** The total dollar value of all investments inside a portfolio right now. Like checking the total balance of a bank account for the entire fund. Displayed as the headline number on the Dashboard.

**Annualized Return:** The average yearly return, even if the measurement period is shorter or longer than a year. Makes different-length periods comparable on the same scale. Computed using the formula `(1 + cumulative_return)^(252/num_trading_days) - 1`.

**Asset Class:** A broad category of investment type—stocks (equities), bonds (fixed income), alternatives (REITs, gold), cash. Different asset classes have different risk/return profiles; mixing them reduces portfolio risk through diversification.

**Attribution:** The process of decomposing the total portfolio return into contributions from individual holdings and sectors. Answers "where did our gains and losses come from?" Shown on the Attribution page.

**Beta:** A measure of how much the portfolio moves relative to its benchmark. Beta = 1.0 means it moves exactly with the market. Beta = 1.2 means it moves 20% more. Calculated as `Cov(portfolio returns, benchmark returns) / Var(benchmark returns)`.

**Benchmark:** A standard market index used as a comparison point for portfolio performance. The Growth Equity Portfolio uses the S&P 500; Canadian-focused portfolios use the S&P/TSX Composite; Global Macro uses MSCI World. Tells you whether active management added value over just buying the index.

**Contributor (Bottom/Top):** A holding that had the most significant negative or positive effect on total portfolio return during a period. Calculated as `security weight × security return`. Top and bottom 5 are highlighted on the Attribution page.

**Cost Basis:** The original price paid for an investment. Used to calculate unrealized profit or loss: `market value - cost basis`. Shown in the Holdings table.

**CSV Export:** A feature that downloads table data as a spreadsheet file (comma-separated values) that opens in Excel or Google Sheets. Triggered by the "Export CSV" button in `DataTable` components.

**CVaR (Conditional Value at Risk / Expected Shortfall):** The average loss on the worst days—given that a very bad day happens, how bad is it on average? Computed as the mean of all daily returns below the VaR threshold. More informative than VaR because it describes severity, not just the cutoff.

**Cumulative Return:** The total percentage gain or loss since a chosen start date, compounding each day's return. Formula: `product(1 + daily_return for each day) - 1`. If the portfolio went up 1% Monday, down 0.5% Tuesday, and up 2% Wednesday, the cumulative return is `(1.01 × 0.995 × 1.02) - 1 ≈ 2.46%`.

**Daily Return:** How much the portfolio's value changed on a single day, expressed as a fraction (0.01 = 1%). Stored precomputed in the `portfolio_returns` table.

**Drawdown:** How far the portfolio is currently below its highest-ever value at any given moment. Always zero or negative. When the portfolio recovers to a new high, the drawdown resets to zero. Plotted as a shaded area chart on the Risk and Performance pages.

**Excess Return:** The difference between the portfolio's cumulative return and the benchmark's cumulative return over the same period. Positive means the portfolio beat the benchmark.

**FTSE Canada Universe Bond Index:** An index tracking the performance of the broad Canadian bond market (government and corporate bonds). Used as the benchmark for bond-heavy and balanced portfolios. Represented by the `XBB.TO` ETF ticker in the seed data.

**Holding:** A single investment position inside a portfolio—for example, 500 shares of Royal Bank of Canada. Each row in the Holdings table represents one holding.

**Information Ratio:** A score measuring how consistently the portfolio outperforms its benchmark. Calculated as `annualized_excess_return / tracking_error`. A higher information ratio means outperformance is reliable rather than occasional. Used alongside tracking error to judge manager skill.

**Market Value:** What a holding is worth at today's price: `quantity × current price`. Changes every day as prices move. The sum of all holdings' market values is the total AUM.

**Max Drawdown:** The single largest peak-to-trough loss over the measured period—if the portfolio hit $100M at its best and then fell to $82M, the max drawdown is -18%. Represents the worst loss an investor would have felt if they bought at exactly the peak.

**MSCI World Index:** A stock market index tracking large and mid-sized companies across 23 developed countries. Used as the benchmark for the Global Macro Portfolio. Represented by the `URTH` ETF ticker.

**Period (1M / 3M / 6M / YTD / 1Y / SI):** The time window used for analytics. 1M = last 30 days, 3M = last 90 days, 6M = last 180 days, YTD = January 1 to today, 1Y = last 12 months, SI = Since Inception (from the portfolio launch date). Controlled by the period selector in the header.

**Portfolio:** A collection of investments managed together under a strategy. This app has four: Growth Equity, Balanced Income, Canadian Dividend, and Global Macro. Each is managed to a benchmark and has its own holdings, performance history, and analytics.

**Portfolio Health:** A quick summary judgment of overall portfolio condition displayed on the Dashboard. Derived from the Sharpe ratio: above 0.5 = Healthy (green dot), 0 to 0.5 = Monitor (amber dot), below 0 = At Risk (red dot).

**Risk-Free Rate:** The return available from the safest possible investment, such as a government Treasury bill. Set to 4.5% in the application configuration. Used as the baseline in the Sharpe ratio formula—any portfolio return above this rate represents genuine risk-taking.

**Rolling Volatility:** Volatility measured over a sliding window of recent days (30-day or 90-day), recalculated each day. Shows how risk has evolved over time rather than giving a single summary number. A sudden spike in 30-day rolling vol signals that the portfolio became significantly more turbulent.

**S&P 500:** An index of the 500 largest US companies by market capitalization. Often treated as the definitive measure of "the US stock market." Used as the benchmark for the Growth Equity Portfolio.

**S&P/TSX Composite:** An index of the largest companies listed on the Toronto Stock Exchange. The primary benchmark for Canadian equity portfolios in this application.

**Sector:** A group of companies in similar industries, such as Financials (banks, insurers), Technology, Energy, Healthcare, Utilities, Materials, Communication Services, Consumer Staples, Consumer Discretionary, Real Estate, and Fixed Income. The sector allocation chart shows how the portfolio's money is spread across these categories.

**Security:** A tradable financial instrument—most commonly a stock (ownership share in a company) or a bond (a debt instrument). Each security has a unique ticker, sector, and asset class.

**Security Attribution:** The return contribution from choosing specific stocks within a sector, as distinct from the sector allocation decision. Isolates individual security selection skill.

**Sector Attribution:** The return contribution from being overweight or underweight in specific sectors compared to the benchmark. If the portfolio had 20% in Technology when the benchmark had 15%, and tech outperformed, the sector attribution for Technology would be positive.

**Sharpe Ratio:** Return earned per unit of risk taken, after subtracting the risk-free rate. Formula: `(annualized_return - risk_free_rate) / annualized_volatility`. A Sharpe of 1.0 means you earned 1% of excess return per 1% of volatility. Generally, above 1.0 is good, above 2.0 is excellent. Below 0 means the portfolio did not even beat the risk-free rate.

**Strategy:** The investment philosophy guiding how a portfolio is built. Examples: Growth Equity (buy high-growth companies), Balanced Income (mix stocks and bonds for stability + income), Canadian Dividend (high-yield Canadian stocks), Global Macro (multi-asset based on global economic trends).

**Target Weight:** The intended percentage allocation for a holding, set by the portfolio manager's strategy. Compared to the actual weight to compute weight drift.

**Ticker:** A short alphanumeric code identifying a security on an exchange, such as `AAPL` for Apple or `RY.TO` for Royal Bank of Canada (`.TO` suffix indicates TSX listing).

**Tracking Error:** The annualized standard deviation of the portfolio's excess returns versus the benchmark. Low tracking error (e.g., 1-2%) means the portfolio closely mirrors the benchmark. High tracking error (e.g., 8-10%) means it takes large independent bets. Formula: `std(portfolio_daily_returns - benchmark_daily_returns) * sqrt(252)`.

**VaR (Value at Risk):** A threshold loss that represents a "typical bad day." At 95% confidence, VaR answers: "on the worst 5% of trading days, the portfolio loses at least this much." Computed using the 5th percentile of historical daily returns.

**Volatility:** The standard deviation of daily returns, scaled to an annual basis (`std(daily_returns) * sqrt(252)`). Higher volatility means larger and more unpredictable swings in the portfolio's value.

**Weight:** The percentage of the total portfolio a single holding or sector represents: `holding market value / total portfolio market value`. Weights for all holdings sum to approximately 100%.

**Weight Drift:** The difference between a holding's current weight and its target weight: `actual_weight - target_weight`. Positive drift means the position has grown larger than intended (perhaps due to strong price appreciation); negative drift means it has shrunk. A flagged drift signals it may be time to rebalance.

**Holdings Editor:** The in-app UI for managing portfolio composition. Accessed from the Holdings page. Lets you create new portfolios, edit portfolio metadata (name, strategy, benchmark), add new stock positions, update quantities, and remove positions — all without touching the database directly. Each action dispatches a Redux thunk that calls the corresponding CRUD endpoint.

**Live Prices:** End-of-day close prices sourced from Yahoo Finance via `yfinance` and stored in the `prices` table. Contrast with the original GBM-simulated prices used by `seed.py`. Live prices are updated nightly by `refresh_service` and are used by all analytics calculations from v2 onward.

**Daily Refresh:** The scheduled process (`0 23 * * *` UTC) that fetches new close prices from Yahoo Finance and keeps the analytics current. Triggered automatically by the GitHub Actions `refresh-prices.yml` workflow, or manually via `python refresh_prices.py` or `POST /api/admin/refresh-prices`. The timestamp of the last successful refresh is visible at `GET /api/health/keepalive`.

---

## 15. Common Tasks

### Add a new portfolio

1. Add a new entry to `PORTFOLIO_CONFIGS` in `backend/seed.py`, specifying `name`, `strategy`, `benchmark_ticker`, `currency`, `description`, `target_mv`, `security_weights`, and `drift_factor`.
2. If you need new securities, add them to the `SECURITIES` list with their ticker, name, sector, asset class, currency, exchange, and base price.
3. Re-run `python seed.py` (this drops and recreates all tables).

### Create a new portfolio from the UI (v2)

1. Click the "+ New Portfolio" button in the Header.
2. Fill in the portfolio name, strategy, currency, and benchmark in the `PortfolioFormModal`.
3. Click **Save**. The `createPortfolio` thunk posts to `POST /api/portfolios` and the portfolio list refreshes automatically.
4. Select the new portfolio in the Header dropdown and use the "+ Add Holding" button on the Holdings page to populate it.

### Add a stock to your portfolio from the UI (v2)

1. Select the target portfolio in the Header.
2. Navigate to the **Holdings** page.
3. Click **+ Add Holding**. The `HoldingFormModal` opens.
4. Enter the ticker in the Ticker field and tab out. The `lookupTicker` thunk calls `GET /api/securities/lookup?ticker=` and auto-fills the security name, sector, and exchange.
5. Enter the quantity (number of shares) and optional target weight.
6. Click **Save**. The `addHolding` thunk posts to `POST /api/portfolios/{id}/holdings` and the table refreshes.

### Trigger a manual price refresh (v2)

Option A — CLI (recommended for development):
```bash
cd backend
source venv/bin/activate
python refresh_prices.py
```

Option B — HTTP (useful after deployment):
```bash
curl -X POST https://your-backend.koyeb.app/api/admin/refresh-prices \
  -H "X-Refresh-Token: your-secret-token"
```

The response includes `{updated_securities, updated_returns_through, skipped, errors}`. Check `errors` for any tickers that could not be fetched.

### Add a new analytics endpoint

1. Write the analytics logic as a pure function in `backend/app/services/analytics.py`. Add a Pydantic response schema in `schemas/schemas.py`.
2. Add a service function in `portfolio_service.py` that fetches data and calls your analytics function.
3. Add a route handler in `routes/portfolios.py` using `@router.get(...)`.
4. Add a typed method to `frontend/src/api/portfolioApi.ts`.
5. Add a new thunk in `analyticsSlice.ts`, state field, and `extraReducers` cases.
6. Add the corresponding TypeScript interface in `frontend/src/types/index.ts`.
7. Consume the data in the appropriate page component.

### Add a new KPI card

1. Ensure the metric is already in the API response schema (or add it per the analytics endpoint steps above).
2. In the relevant page component, add a `<KPICard>` element with `label`, `value` (formatted string using a helper from `format.ts`), optional `change`, and optional `icon`.

### Add a new glossary term

1. Add a new key-value pair to the `glossary` object in `frontend/src/utils/glossary.ts`. The value must have `label`, `whatItIs`, `whatItDoes`, and `howItsUsed` strings. TypeScript will automatically extend `TermKey` to include the new key.
2. In any page or component, wrap the relevant UI text with `<Term termKey="yourNewKey">Label text</Term>`. Add `iconOnly` if you only want the help icon without rendering the label text again.

---

## 16. Troubleshooting

**CORS errors in the browser console**

The FastAPI server reads allowed origins from `CORS_ORIGINS`. In development, ensure `.env` contains `CORS_ORIGINS=http://localhost:5173`. In production on Koyeb, ensure the `CORS_ORIGINS` environment variable is set to your exact Vercel URL (e.g., `https://your-app.vercel.app`) with no trailing slash.

**`DATABASE_URL` connection refused**

Verify that PostgreSQL is running and that the `DATABASE_URL` in `backend/.env` uses the correct host, port, user, password, and database name. On macOS with Homebrew Postgres, the default socket may require `postgresql://localhost/portfolio_analytics` (no user/password). If the URL starts with `postgres://`, `database.py` automatically rewrites it to `postgresql://`.

**Data missing after deployment (empty portfolio list)**

The seed script must be run manually after deployment. On Koyeb, use the service console to run `python seed.py`. The script drops and recreates all tables, so run it only once after initial deployment or when you want to reset all data.

**Frontend shows a blank page or 404 on refresh**

Vercel requires a rewrite rule for single-page applications so all paths resolve to `index.html`. In the `frontend` directory, create `vercel.json` with:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Build errors: TypeScript type mismatches after adding fields**

TypeScript interfaces in `frontend/src/types/index.ts` must exactly mirror the Pydantic schemas in `backend/app/schemas/schemas.py`. If you add an optional field to a Pydantic schema, add the corresponding `field: Type | null` to the TypeScript interface. If you add a required field, the frontend will fail to compile until the interface is updated.

**Koyeb free-tier cold starts**

The free Eco tier on Koyeb suspends services after a period of inactivity. The first request after a cold start may take 5–15 seconds. This is normal. Consider setting up a health check ping every few minutes via an external monitoring service to keep the backend warm if latency matters.

**`python seed.py` fails mid-run**

The seed script wraps the entire operation in a try/except with `db.rollback()` on failure, so a partial run will not leave corrupted data. Fix the root cause (usually a missing `.env` variable or a database connection issue), then re-run the script. Because it calls `Base.metadata.drop_all` at the start, each run is idempotent—it always starts from a clean state.

**Refresh job failed (Yahoo Finance temporary block or missing ticker)**

The nightly `refresh-prices.yml` workflow calls `refresh_service.refresh_all()`, which returns an `errors` list for any tickers it could not fetch. Common causes:

- Yahoo Finance applies informal rate limits. The built-in `TTLCache(ttl=3600)` reduces redundant calls, but back-to-back runs within seconds can still trigger a block. Wait a few minutes and re-run.
- A ticker has been delisted or renamed on Yahoo Finance. Check the `errors` list for the offending ticker. Update or remove the security record in the database, then re-run the refresh.
- The `REFRESH_TOKEN` in GitHub Secrets does not match the one set on Koyeb. The endpoint will return a 403. Update the secret to match.

**Keepalive is consuming too many GitHub Actions minutes**

The default `*/10 * * * *` schedule runs 144 times per day (about 4,320 job-minutes per month). For private repositories on GitHub's free plan (2,000 minutes/month), this exceeds the budget. To reduce consumption, change the cron expression in `.github/workflows/keepalive.yml`:

- `*/15 * * * *` — every 15 minutes (~2,880 minutes/month)
- `*/20 * * * *` — every 20 minutes (~2,160 minutes/month)

Koyeb's inactivity timeout is typically around 15 minutes on the free tier, so `*/15` is the recommended balance between cost and cold-start prevention.

**Stock data is stale (prices not updating)**

Check the last successful refresh by calling:

```
GET /api/health/keepalive
```

The response includes `last_refresh`. If it is more than 24 hours old, the nightly cron likely failed. Check the GitHub Actions run log for errors. You can trigger a manual refresh immediately using `python refresh_prices.py` or `POST /api/admin/refresh-prices` (see Common Tasks above).
