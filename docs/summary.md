# The Big Picture (Start Here)
"This is a full-stack portfolio analytics dashboard modeled after the internal tools used by institutional asset management firms. It monitors multiple investment portfolios -- tracking performance, risk, holdings, and return attribution. The frontend is React with TypeScript, the backend is Python with FastAPI, and the data lives in PostgreSQL. It's deployed with Vercel serving the frontend and Koyeb hosting the backend and database."

## 1. Database Layer — The Foundation
### Schema Design
"I designed a normalized relational schema with 8 tables that model how institutional portfolio data actually works."

The core tables in backend/app/models/models.py:

#### portfolios
— Each row is a portfolio with a name, strategy, currency, inception date, and a foreign key to its benchmark. This is the top-level entity everything else hangs off of.

#### benchmarks
— Reference indices like S&P 500 or S&P/TSX Composite. Portfolios link to benchmarks via benchmark_id so you can do relative performance analysis.

#### securities
— The universe of investable assets (34 total: Canadian equities, US equities, bond ETFs, alternatives). Each has a ticker, sector, asset class, currency, and exchange.

#### holdings
— Point-in-time snapshots of what each portfolio owns on a given date. This is a many-to-many between portfolios and securities, with a date dimension. Stores quantity, market value, weight, target weight, and cost basis.

#### prices
— Daily OHLCV price history for every security. Used to compute security-level returns for attribution.

#### portfolio_returns
— Pre-computed daily and cumulative returns for each portfolio, plus the market value on that date.

#### benchmark_returns
— Same structure for benchmarks, so we can compare portfolio vs benchmark performance.

#### transactions
— Buy/sell/dividend history. Not heavily used in the analytics but rounds out the data model.

### Key Design Decisions
"I added composite indexes on the most frequently queried column pairs. For example, (portfolio_id, date) on the holdings, returns, and transactions tables. These are the queries the app runs most -- 'give me all holdings for portfolio X on date Y' or 'give me all returns for portfolio X between dates A and B.' Without these indexes, every request would do a full table scan."

"I used Numeric types with explicit precision (Numeric(18, 2) for dollar amounts, Numeric(12, 8) for returns) instead of floats. This avoids floating-point rounding errors that would compound when you're doing cumulative return calculations across hundreds of trading days."

"Relationships use lazy='dynamic' on the Portfolio model, which means accessing portfolio.holdings returns a query object rather than eagerly loading thousands of rows. This prevents the N+1 problem and lets the service layer apply filters before execution."

### Seed Script
"The seed script (seed.py) generates realistic institutional-grade sample data using geometric Brownian motion for price simulation -- the same stochastic model used in quantitative finance (it's the foundation of Black-Scholes). It creates ~850 trading days of prices, computes portfolio returns as the weighted sum of individual security returns, applies random weight drift every 20 days to simulate real portfolio drift, and generates holding snapshots on Fridays and month-ends."

## 2. Backend API — FastAPI + Service Layer
### Architecture
"The backend follows a three-layer architecture: routes → services → database. This separates concerns cleanly."

#### Routes (routes/portfolios.py) — Thin controllers.
They handle HTTP concerns: parse query parameters, validate with regex patterns (e.g., ^(1M|3M|6M|YTD|1Y|SI)$), inject the database session via FastAPI's Depends(get_db), and delegate to the service layer. They catch ValueError from services and convert them to 404s.

#### Services (services/portfolio_service.py) — The core business logic.
Each function takes a database session, fetches the data with SQLAlchemy queries, and calls the analytics module to compute the financial metrics. This is where the resolve_date_range() function lives, which translates period codes (1M, 3M, YTD, etc.) into concrete start/end dates using dateutil.relativedelta.

#### Analytics (services/analytics.py) — A pure calculation module with zero database dependencies. 
All functions take arrays of floats and return floats. This makes them independently testable. It implements: cumulative return (compound product), annualized return (geometric scaling to 252 trading days), volatility (annualized standard deviation), Sharpe ratio, max drawdown (using running maximum), rolling volatility, tracking error, information ratio, beta (covariance/variance), VaR (historical percentile), and CVaR (expected shortfall).

### Schemas (Pydantic)
"Every API response has a Pydantic schema (schemas/schemas.py) that defines the exact shape of the JSON. This gives me automatic request validation, response serialization, and OpenAPI documentation generation. For example, PortfolioSummary includes the portfolio metadata, all six KPI numbers, optional benchmark-relative metrics (tracking error, information ratio), the top 5 positions, and the as-of date. The Optional types reflect that benchmark-relative metrics are only available when a portfolio has an assigned benchmark."

#### How a Request Flows (Example: Dashboard Load)
"When you load the dashboard, the frontend fires 4 parallel API requests:

GET /api/portfolios/1/summary?period=YTD — The service queries portfolio_returns for all daily returns between January 1 and today, computes cumulative return, annualized return, volatility, Sharpe, and max drawdown using the analytics module, then queries the latest holdings to get the top 5 positions.

GET /api/portfolios/1/performance?period=YTD — Queries both portfolio and benchmark daily returns, builds parallel cumulative return series (each day compounds the previous), and returns the time series plus summary statistics.

GET /api/portfolios/1/sector-allocation — Runs a GROUP BY query joining holdings to securities, summing weights and market values by sector.

GET /api/portfolios/1/asset-allocation — Same pattern but grouped by asset class.

All four run concurrently because the frontend dispatches them in the same useEffect."

### Configuration + CORS
"Configuration uses pydantic-settings with a cascading priority: environment variables override .env file values, which override defaults. This means the same code works locally with a .env file and in production with Koyeb's environment variables. CORS middleware is configured to only accept requests from the frontend's origin."

### Database Connection Handling
"The database.py module handles the postgres:// vs postgresql:// scheme difference -- some hosted providers like Koyeb use the shorter form that SQLAlchemy doesn't accept natively, so I do a string replacement. The get_db() generator provides a session-per-request pattern with automatic cleanup via try/finally."

## 3. Frontend — React + TypeScript + Redux Toolkit
### Architecture
"The frontend is a single-page application built with React 18 and TypeScript, using Redux Toolkit for state management, React Router for navigation, Tailwind CSS for styling, and Recharts for data visualization."

### Routing
"App.tsx sets up a BrowserRouter with a shared Layout wrapper (sidebar + header) and five page routes: / (Dashboard), /holdings, /performance, /attribution, /risk. The vercel.json has a catch-all rewrite so all routes serve index.html -- this is essential for SPA routing to work on Vercel."

### State Management (Redux Toolkit)
"I organized the Redux store into four slices:

#### filterSlice
— Holds the global UI state: which portfolio is selected and which time period is active.
When the user changes these in the sidebar/header, actions like setSelectedPortfolio and setPeriod are dispatched, which triggers re-fetches across all pages.

#### portfolioSlice
— Manages the list of portfolios and the current portfolio's summary data.
Uses createAsyncThunk for the API calls, which gives me built-in pending/fulfilled/rejected lifecycle states for loading spinners and error handling.

#### analyticsSlice
— Manages performance, allocation, attribution, benchmark comparison, and risk data.
Each has its own loading flag tracked in a Record<string, boolean> so the UI can show skeleton loaders per-section rather than a single global spinner.

#### holdingsSlice
— Manages the holdings table data separately since it has its own filtering (search, sector, asset class) independent of the global time period filter."

### API Client
"The api/client.ts module is a typed fetch wrapper. It constructs URLs from the VITE_API_BASE_URL environment variable, attaches query parameters, and throws a typed ApiError for non-200 responses. The api/portfolioApi.ts module builds on top of this with typed methods for every endpoint -- each call is generic (api.get<PerformanceResponse>) so TypeScript enforces the response shape."

### Type Safety
"I maintain a types/index.ts file with TypeScript interfaces that mirror the backend Pydantic schemas exactly. This means if the API returns a field the frontend doesn't expect, or vice versa, TypeScript catches it at compile time. The types flow from the API client → Redux thunks → slice state → component props."

### How a Page Component Works (Example: Dashboard)
### "The Dashboard component:

Reads the selected portfolio ID and period from the Redux filters slice using useAppSelector.
Dispatches four parallel async thunks in a useEffect that depends on [selectedPortfolioId, period]. Whenever the user switches portfolios or time periods, all four API calls re-fire.
Renders loading skeletons while summaryLoading or loading.performance is true.
Displays six KPI cards, a performance line chart, two allocation donut charts, and a top-5 holdings table.
Handles errors with an ErrorState component that shows a retry button."

### UI Components
"I built reusable components in components/common/:

#### KPICard
 — Displays a metric with a label, formatted value, optional change indicator (green/red), and icon. Used 20+ times across all pages.

#### DataTable
 — A generic, typed table component (DataTable<T>) that accepts column definitions with custom renderers, supports sorting by any column, and has a CSV export button.

#### PeriodSelector
 — The 1M/3M/6M/YTD/1Y/SI toggle that dispatches setPeriod to Redux.

#### LoadingSpinner / SkeletonCard / SkeletonChart
 — Skeleton loaders that match the layout of the real content to prevent layout shift.

The chart components in components/charts/ wrap Recharts with consistent styling -- PerformanceChart renders multi-line cumulative returns, AllocationChart renders donut charts with custom labels, VolatilityChart renders rolling 30-day and 90-day volatility lines, ContributionChart renders horizontal bar charts for attribution, and DrawdownChart renders the drawdown area chart."

Styling
"Tailwind CSS with a custom configuration. The design is desktop-first (optimized for portfolio managers on wide screens), using a fixed sidebar layout. The grid system is responsive -- KPI cards go from 2 columns on medium screens to 6 columns on XL screens."

## 4. Data Flow End-to-End
### "Here's the complete journey of a single user interaction:

User clicks '3M' in the period selector

Redux dispatches setPeriod('3M') → filter slice updates

Dashboard's useEffect detects the period change → dispatches fetchPortfolioSummary({id: 1, period: '3M'})

Redux thunk calls portfolioApi.getSummary(1, '3M')

API client sends GET https://koyeb-backend.app/api/portfolios/1/summary?period=3M

FastAPI route handler receives the request, validates the period regex, injects a DB session

portfolio_service.get_portfolio_summary() calls resolve_date_range() which computes start_date = today - 3 months

SQLAlchemy queries portfolio_returns WHERE date BETWEEN start AND end, using the composite index

The analytics module computes cumulative return, volatility, Sharpe, max drawdown from the daily returns array

Pydantic serializes the response to JSON

JSON travels back through CORS middleware → Koyeb → internet → Vercel → browser

Redux thunk fulfills → slice state updates → React re-renders the KPI cards with new values"

## 5. Deployment Architecture
### "Three-tier deployment:

Vercel serves the static frontend build (npm run build produces optimized JS/CSS bundles). Vercel's edge network serves these from the closest CDN node. The VITE_API_BASE_URL env var is baked in at build time and points to the Koyeb backend.

Koyeb runs the FastAPI backend as a web service, detected via the Procfile and Python buildpack. It auto-scales between 0-1 instances on the free tier. Environment variables (DATABASE_URL, CORS_ORIGINS, RISK_FREE_RATE) are injected at runtime.

Koyeb Managed PostgreSQL hosts the database in the same region (US East) as the backend to minimize latency.

Both Vercel and Koyeb have GitHub integration, so pushing to main triggers automatic redeployment of both services."

### Key Technical Decisions to Highlight
#### Why FastAPI over Django/Flask?
 — Async support, automatic OpenAPI docs, Pydantic validation built-in, and high performance for a data-heavy API.

#### Why Redux Toolkit over React Context?
 — The app has complex cross-cutting state (selected portfolio + period affect every page). Redux gives predictable state updates, DevTools for debugging, and createAsyncThunk handles the async lifecycle.

#### Why pre-computed returns in the DB?
 — Computing cumulative returns from raw prices on every request would be expensive. Storing daily returns lets the service layer do simple array operations instead of joining prices across hundreds of securities.

#### Why a pure analytics module?
 — Separating calculations from database logic makes the math independently testable and reusable. You could swap the data source without touching the analytics.