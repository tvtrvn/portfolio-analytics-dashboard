# Portfolio Analytics Dashboard

> A production-grade, full-stack portfolio analytics platform built for institutional asset management teams. Designed to mirror the tools used by portfolio managers, investment analysts, and risk teams at firms like TD Asset Management.

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

## Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Frontend   | React 18 · TypeScript · Redux Toolkit · Tailwind CSS |
| Charts     | Recharts                                             |
| Backend    | Python · FastAPI · SQLAlchemy · Pydantic              |
| Database   | PostgreSQL                                           |
| Deployment | Vercel (frontend) · Render/Railway (backend)         |

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

# Create tables and seed data
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

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set environment variable: `VITE_API_BASE_URL=https://your-backend-url.com/api`
4. Deploy

### Backend (Render / Railway)

1. Create a new web service pointing to the `backend` directory
2. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set environment variables:
   - `DATABASE_URL` — your hosted PostgreSQL connection string
   - `CORS_ORIGINS` — your Vercel frontend URL
   - `RISK_FREE_RATE` — configurable risk-free rate (default: 0.045)
4. After deployment, run `python seed.py` to populate the database

### Database (Hosted PostgreSQL)

Compatible with:
- Neon
- Supabase
- Railway PostgreSQL
- Render PostgreSQL
- AWS RDS

## Environment Variables

### Backend (`.env`)

```
DATABASE_URL=postgresql://user:pass@host:5432/portfolio_analytics
CORS_ORIGINS=http://localhost:5173
RISK_FREE_RATE=0.045
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

## Screenshots

> _Screenshots of the running application can be added here._

| Dashboard | Holdings | Performance |
| --------- | -------- | ----------- |
| _screenshot_ | _screenshot_ | _screenshot_ |

| Attribution | Risk Metrics |
| ----------- | ------------ |
| _screenshot_ | _screenshot_ |

## Resume Description

**Portfolio Analytics Dashboard** — Designed and built a production-grade, full-stack portfolio analytics platform modeled after internal tools used by institutional asset management teams. The application provides real-time portfolio monitoring, performance analytics (cumulative returns, Sharpe ratio, rolling volatility), risk assessment (VaR, CVaR, max drawdown, beta), and return attribution by security and sector. Built with React/TypeScript/Redux Toolkit on the frontend with Recharts for data visualization, and Python/FastAPI/SQLAlchemy on the backend with a normalized PostgreSQL schema. Features include multi-portfolio support, benchmark-relative analytics, time-period filtering, and CSV data export. Designed with an institutional, desktop-first UI optimized for portfolio managers and research analysts.

## License

This project is for portfolio/demo purposes.
