# Portfolio Analytics Dashboard

> A production-grade, full-stack portfolio analytics platform built for institutional asset management teams. Designed to mirror the tools used by portfolio managers, investment analysts, and risk teams at firms like TD Asset Management.

---

**What's new in v2 — Live Market Data**
Version 2 replaces simulated GBM prices with live end-of-day closes fetched from Yahoo Finance via `yfinance`. A holdings editor lets you add, edit, and delete portfolios and positions directly from the UI. A GitHub Actions cron job refreshes prices every night at 23:00 UTC, and a keepalive workflow pings the backend every 10 minutes to prevent cold starts.

---

## Overview

This application provides comprehensive portfolio monitoring, performance analytics, risk assessment, and attribution analysis through a professional, institutional-quality dashboard interface.

### Key Features

- **Dashboard Overview** — Total market value, daily/cumulative returns, Sharpe ratio, max drawdown, sector & asset class allocation charts, top positions
- **Holdings & Exposures** — Detailed holdings table with filtering by sector/asset class, search, sorting, weight drift vs. targets, CSV export
- **Performance Analytics** — Historical cumulative returns, portfolio vs benchmark comparison, rolling volatility, drawdown analysis
- **Attribution Analysis** — Return contribution by security and sector, best/worst contributors, benchmark-relative attribution
- **Risk Metrics** — Annualized volatility, Sharpe ratio, VaR/CVaR, beta, tracking error, information ratio, rolling volatility charts
- **Multi-Portfolio Support** — Growth Equity, Balanced Income, Canadian Dividend, and Global Macro portfolios
- **Time Period Filters** — 1M, 3M, 6M, YTD, 1Y, Since Inception
- **Live Daily Prices** — End-of-day closes fetched from Yahoo Finance (`yfinance`); prices refresh nightly via a GitHub Actions cron job
- **Holdings Editor** — Add, edit, and delete portfolios and individual stock positions directly from the UI

## Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Frontend   | React 18 · TypeScript · Redux Toolkit · Tailwind CSS |
| Charts     | Recharts                                             |
| Backend    | Python · FastAPI · SQLAlchemy · Pydantic              |
| Database   | PostgreSQL                                           |
| Deployment | Vercel (frontend) · Koyeb (backend + PostgreSQL)     |

## Project Structure

```
portfolio-analytics-dashboard-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Environment settings
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routes/              # API route handlers
│   │   └── services/            # Business logic & analytics
│   ├── seed.py                  # Database seed script
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed API client
│   │   ├── components/
│   │   │   ├── charts/          # Recharts wrapper components
│   │   │   ├── common/          # KPICard, DataTable, etc.
│   │   │   └── layout/          # Sidebar, Header, Layout
│   │   ├── pages/               # Dashboard, Holdings, Performance, etc.
│   │   ├── store/               # Redux Toolkit slices
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Formatting & CSV export
│   ├── package.json
│   └── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint                                    | Description                          |
| ------ | ------------------------------------------- | ------------------------------------ |
| GET    | `/api/portfolios`                           | List all portfolios                  |
| GET    | `/api/portfolios/{id}/summary`              | Portfolio summary with KPIs          |
| GET    | `/api/portfolios/{id}/holdings`             | Holdings with filters                |
| GET    | `/api/portfolios/{id}/performance`          | Historical performance series        |
| GET    | `/api/portfolios/{id}/sector-allocation`    | Sector weight breakdown              |
| GET    | `/api/portfolios/{id}/asset-allocation`     | Asset class breakdown                |
| GET    | `/api/portfolios/{id}/attribution`          | Return attribution by security/sector|
| GET    | `/api/portfolios/{id}/benchmark-comparison` | Portfolio vs benchmark analytics     |
| GET    | `/api/portfolios/{id}/risk-metrics`         | Risk metrics with rolling vol/dd     |
| GET    | `/api/health`                               | Health check                         |
| GET    | `/api/health/keepalive`                     | Liveness check + last refresh time  |
| POST   | `/api/portfolios`                           | Create a new portfolio               |
| PUT    | `/api/portfolios/{id}`                      | Update portfolio metadata            |
| DELETE | `/api/portfolios/{id}`                      | Delete a portfolio                   |
| GET    | `/api/securities`                           | List all known securities            |
| GET    | `/api/securities/lookup?ticker=`            | Look up a ticker via yfinance        |
| POST   | `/api/securities`                           | Add a new security                   |
| POST   | `/api/portfolios/{id}/holdings`             | Add a holding to a portfolio         |
| PUT    | `/api/portfolios/{id}/holdings/{security_id}` | Update a holding's quantity/weight |
| DELETE | `/api/portfolios/{id}/holdings/{security_id}` | Remove a holding                   |
| POST   | `/api/admin/refresh-prices`                 | Trigger a price refresh (requires `X-Refresh-Token` header) |

All analytics endpoints accept optional query parameters: `period` (1M, 3M, 6M, YTD, 1Y, SI), `start_date`, `end_date`.

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```bash
createdb portfolio_analytics
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and edit environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Create tables and seed demo data (first run only)
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to `http://localhost:8000`.

### 4. Refresh Prices Manually (optional)

After seeding, you can pull live closes from Yahoo Finance for all securities:

```bash
cd backend
python refresh_prices.py
# Optional flags:
# --portfolio-id N   refresh only portfolio N
# --backfill-days N  how many calendar days of history to backfill (default: 365)
```

`REFRESH_TOKEN` must be set in your `.env` file before running the script.

## Deployment

### 1. Database (Koyeb Managed PostgreSQL)

1. Log in to [Koyeb](https://www.koyeb.com/) and go to **Databases**
2. Click **Create Database Service**
3. Choose a region (e.g., `was` for US East or `fra` for EU)
4. Once provisioned, copy the **connection string** from the database overview page

### 2. Backend (Koyeb Web Service)

1. In the Koyeb dashboard, click **Create Service** → **Web Service**
2. Select **GitHub** and connect your `portfolio-analytics-dashboard` repo
3. Configure the service:
   - **Builder**: Buildpack
   - **Work directory**: `backend`
   - **Run command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance type**: Free (Eco)
4. Add environment variables:
   - `DATABASE_URL` — the Koyeb PostgreSQL connection string from step 1
   - `CORS_ORIGINS` — your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
   - `RISK_FREE_RATE` — `0.045`
   - `REFRESH_TOKEN` — a secret string used to authorize the `/api/admin/refresh-prices` endpoint
   - `MARKET_DATA_PROVIDER` — `yfinance` (default)
   - `BACKFILL_DAYS` — `365` (default)
5. Deploy — Koyeb will detect `requirements.txt` and `runtime.txt` automatically
6. After the service is live, open the Koyeb console and run `python seed.py` to populate the database

### 4. GitHub Actions — Live Data Automation

Two workflows automate price updates and backend keepalive. Add the following secrets to your GitHub repository (**Settings → Secrets and variables → Actions**):

| Secret | Value |
| ------ | ----- |
| `BACKEND_URL` | Your Koyeb backend URL, e.g. `https://your-backend-app.koyeb.app` |
| `REFRESH_TOKEN` | The same token set in the Koyeb environment variables |

- **`refresh-prices.yml`** — Runs at `0 23 * * *` UTC every night. Posts to `/api/admin/refresh-prices` to fetch new end-of-day closes.
- **`keepalive.yml`** — Runs every 10 minutes (`*/10 * * * *`). Gets `/api/health/keepalive` to prevent Koyeb cold starts.

### 3. Frontend (Vercel)

1. Go to [Vercel](https://vercel.com/) and click **Add New Project**
2. Import your `portfolio-analytics-dashboard` repo from GitHub
3. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the environment variable:
   - `VITE_API_BASE_URL` — your Koyeb backend URL with `/api` suffix (e.g., `https://your-backend-app.koyeb.app/api`)
5. Deploy

## Environment Variables

### Backend (`.env`)

```
DATABASE_URL=postgresql://user:pass@host:5432/portfolio_analytics
CORS_ORIGINS=http://localhost:5173
RISK_FREE_RATE=0.045
REFRESH_TOKEN=your-secret-token-here
MARKET_DATA_PROVIDER=yfinance
BACKFILL_DAYS=365
```

### Frontend (`.env`)

```
VITE_API_BASE_URL=/api
```

## Database Schema

The application uses a relational schema with the following tables:

- `portfolios` — Portfolio metadata, strategy, benchmark linkage
- `benchmarks` — Benchmark indices (S&P/TSX, S&P 500, etc.)
- `securities` — Individual securities with sector and asset class
- `holdings` — Point-in-time portfolio holdings snapshots
- `prices` — Historical security prices
- `portfolio_returns` — Daily portfolio return series
- `benchmark_returns` — Daily benchmark return series
- `transactions` — Buy/sell/dividend transaction history

## Sample Portfolios

| Portfolio               | Strategy          | Benchmark                     | AUM (seed)    |
| ----------------------- | ----------------- | ----------------------------- | ------------- |
| Growth Equity Portfolio | Growth Equity     | S&P 500 Index                 | ~$150M        |
| Balanced Income         | Balanced Income   | S&P/TSX Composite Index       | ~$250M        |
| Canadian Dividend       | Canadian Dividend | S&P/TSX Composite Index       | ~$100M        |
| Global Macro            | Global Macro      | MSCI World Index              | ~$200M        |

## Resume Description

**Portfolio Analytics Dashboard** — Designed and built a production-grade, full-stack portfolio analytics platform modeled after internal tools used by institutional asset management teams. The application provides real-time portfolio monitoring, performance analytics (cumulative returns, Sharpe ratio, rolling volatility), risk assessment (VaR, CVaR, max drawdown, beta), and return attribution by security and sector. Built with React/TypeScript/Redux Toolkit on the frontend with Recharts for data visualization, and Python/FastAPI/SQLAlchemy on the backend with a normalized PostgreSQL schema. Features include multi-portfolio support, benchmark-relative analytics, time-period filtering, and CSV data export. Designed with an institutional, desktop-first UI optimized for portfolio managers and research analysts.

## License

This project is for portfolio/demo purposes.
