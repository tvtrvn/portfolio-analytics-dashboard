Step 1:
Build me a production-style full-stack web application called “Portfolio Analytics Dashboard” that looks like an internal tool used by an asset management firm such as TD Asset Management.

Tech stack:
- Frontend: React + Redux Toolkit + TypeScript + Tailwind CSS
- Backend: Python + FastAPI
- Database: PostgreSQL
- Charts: Recharts
- Tables: React Table or a clean reusable table component
- ORM/backend DB access: SQLAlchemy
- Deployment-ready structure for Vercel frontend + Render/Railway backend + hosted Postgres

Main purpose:
This app should allow portfolio managers and analysts to monitor portfolio performance, exposures, and risk metrics through an interactive dashboard.

Core features:
1. Dashboard overview page
   - Total portfolio market value
   - Daily return
   - Cumulative return
   - Volatility
   - Sharpe ratio
   - Max drawdown
   - Top 5 positions
   - Sector allocation chart
   - Asset allocation chart

2. Portfolio performance analytics
   - Historical performance line chart
   - Portfolio vs benchmark comparison
   - Rolling volatility
   - Drawdown chart
   - Return contribution by position

3. Holdings and exposures page
   - Holdings table with ticker, name, sector, asset class, weight, market value, return contribution
   - Filters for asset class, sector, strategy, benchmark, and date range
   - Sorting and search

4. Attribution / contribution page
   - Contribution to return by security
   - Contribution by sector
   - Benchmark-relative differences
   - Best and worst contributors

5. Portfolio selection
   - Multiple sample portfolios
   - Example: Growth Equity, Balanced Income, Canadian Dividend, Global Macro

6. Backend analytics APIs
   - REST API endpoints for portfolio summary, holdings, historical returns, sector weights, attribution, and benchmark comparison
   - Analytics calculations in Python
   - Proper data validation with Pydantic
   - Error handling and loading states

7. Database design
   Create a realistic relational schema with tables such as:
   - portfolios
   - holdings
   - securities
   - transactions
   - prices
   - benchmarks
   - portfolio_returns
   - benchmark_returns

8. Seed data
   - Generate realistic sample financial data for multiple portfolios
   - Include sectors, asset classes, benchmarks, daily prices, and holdings history
   - Make the data realistic enough for screenshots and demo use

9. UI/UX expectations
   - Clean professional institutional dashboard style
   - Looks like software used internally by portfolio research teams
   - No flashy consumer-app look
   - Strong spacing, polished cards, clear typography, excellent table usability
   - Responsive but optimized for desktop
   - Include loading spinners, empty states, and error states

10. Code quality
   - Modular folder structure
   - Reusable components
   - Clear comments
   - Environment variable setup
   - README with local setup and deployment steps

Please generate the full project structure and start by:
1. creating the backend folder and FastAPI app structure
2. defining the SQL schema and seed strategy
3. creating the frontend app structure
4. listing all API routes
5. then implementing the app step by step

Step 2:
Upgrade this project so it feels like a real portfolio analytics platform built for institutional asset management, not a student dashboard.

Add the following:
- benchmark-relative analytics
- rolling 30-day and 90-day volatility
- max drawdown calculation
- Sharpe ratio calculation using a configurable risk-free rate
- contribution to return by position
- contribution to return by sector
- portfolio allocation drift vs target weights
- time-period filters: 1M, 3M, 6M, YTD, 1Y, Since Inception
- reusable analytics cards
- drilldown from sector to security-level contributors
- data export to CSV for holdings and analytics tables

Make the code and UI polished enough that a hiring manager at TD would believe this could be an internal analytics prototype.

Step 3:
Design a realistic PostgreSQL schema for a portfolio analytics application used by an asset management team.

Requirements:
- portfolios
- strategies
- accounts
- securities
- benchmarks
- holdings_snapshots
- prices
- portfolio_returns
- benchmark_returns
- transactions

Each table should have:
- proper primary keys
- foreign keys
- indexes where useful
- realistic field names and data types

Then create a Python seed script that generates realistic institutional-style sample data:
- multiple portfolios
- multiple sectors
- multiple asset classes
- daily returns history
- benchmark history
- holdings snapshots over time
- position weights that sum properly
- realistic market values and returns

Make the generated data suitable for charts, tables, and analytics calculations.

Step 4:
Build the backend analytics layer for this portfolio dashboard in FastAPI.

Requirements:
- Use FastAPI + SQLAlchemy + Pydantic
- Separate routes, services, models, and schemas
- Add clear modular architecture

API endpoints needed:
- GET /portfolios
- GET /portfolios/{id}/summary
- GET /portfolios/{id}/holdings
- GET /portfolios/{id}/performance
- GET /portfolios/{id}/sector-allocation
- GET /portfolios/{id}/asset-allocation
- GET /portfolios/{id}/attribution
- GET /portfolios/{id}/benchmark-comparison
- GET /portfolios/{id}/risk-metrics

Analytics to calculate:
- cumulative return
- annualized volatility
- Sharpe ratio
- max drawdown
- contribution to return by position
- contribution by sector
- benchmark-relative excess return

Requirements:
- validated query params for date range and filters
- good error handling
- structured JSON responses
- clean service layer
- testable code
- comments explaining financial calculations

Also include a sample .env.example and database connection setup.

Step 5:
Build the frontend for this Portfolio Analytics Dashboard using React, TypeScript, Redux Toolkit, Tailwind CSS, and Recharts.

Pages:
- Dashboard
- Holdings
- Performance
- Attribution
- Risk Metrics

Requirements:
- Sidebar layout with professional internal-tool styling
- Header with portfolio selector and date range filter
- Reusable KPI cards
- Reusable chart components
- Reusable data table
- Redux slices for portfolios, holdings, analytics, and filters
- Async data fetching from FastAPI
- Loading states, skeletons, and error messages
- Search, sort, and filter support
- Desktop-first polished design

Visual design:
- clean, minimal, institutional, high-trust
- similar to a real internal portfolio management dashboard
- avoid overly flashy startup aesthetics

Also create:
- a clear component folder structure
- typed API client utilities
- centralized filter state
- professional empty states for pages with no data

Step 6:
Prepare this full-stack project for deployment.

Requirements:
Frontend:
- deployable to Vercel
- production env config
- API base URL handling for local and production

Backend:
- deployable to Render or Railway
- requirements.txt
- startup command
- environment variable config
- CORS configuration

Database:
- hosted PostgreSQL compatible
- migration or schema init instructions

Please also create:
- README.md with setup instructions
- local development instructions
- deployment instructions
- example environment variables
- sample screenshots section placeholders
- resume-ready project description paragraph for GitHub

Step 7:
Refine this project so it better matches the type of internal application a Portfolio Research & Analytics team at a large asset management firm would use.

Make the app feel useful for:
- portfolio managers
- investment analysts
- risk analysts
- research teams

Add institutional-use-case features such as:
- benchmark-relative performance
- concentration alerts
- asset class and sector monitoring
- daily portfolio health summary
- quick drilldown from high-level metrics to holdings detail
- support for multiple strategies and mandates
- exportable reporting views
- audit-friendly tables and consistent metric definitions

The UI language, labels, and data model should sound professional and finance-oriented, not generic.