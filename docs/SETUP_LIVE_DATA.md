# Live Data Setup — One-time Instructions

Once these steps are done, the dashboard runs on autopilot: prices refresh daily, the backend stays warm, and you can add or edit holdings from the UI.

---

## 1. Generate a refresh token (30 seconds)

In any terminal:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output. This is your `REFRESH_TOKEN`. Keep it private; treat it like a password.

---

## 2. Add the token to your Koyeb backend (2 minutes)

1. Open [Koyeb dashboard](https://app.koyeb.com/) and select your backend service.
2. Go to **Settings → Environment Variables**.
3. Add a new variable:
   - **Key:** `REFRESH_TOKEN`
   - **Value:** the token you generated above
4. (Optional) Add `BACKFILL_DAYS=365` and `MARKET_DATA_PROVIDER=yfinance` if you want explicit defaults.
5. Click **Redeploy** so the backend picks up the new env var.

---

## 3. Add GitHub Secrets (2 minutes)

Go to your repo on GitHub → **Settings → Secrets and variables → Actions → New repository secret**.

Add two secrets:

| Name | Value |
|------|-------|
| `BACKEND_URL` | Your Koyeb backend URL — e.g. `https://your-app.koyeb.app` (no trailing slash) |
| `REFRESH_TOKEN` | The same token you put in Koyeb |

---

## 4. Push the new code and enable Actions (1 minute)

```bash
git add .
git commit -m "Live data: yfinance refresh + holdings editor + automation"
git push
```

GitHub Actions are enabled by default. To confirm:
- Repo → **Actions** tab → you should see two workflows:
  - **Daily Price Refresh** (runs every day at 23:00 UTC)
  - **Backend Keepalive** (runs every 10 minutes)

If they show "disabled," click **Enable workflow** on each.

---

## 5. Run the first refresh manually (optional but recommended)

This populates 365 days of historical close prices for every ticker in your database.

**Option A — from the GitHub UI:**
- Actions tab → **Daily Price Refresh** → **Run workflow** → **Run workflow** (green button).

**Option B — from your machine via curl:**

```bash
curl -sS -X POST "https://your-app.koyeb.app/api/admin/refresh-prices" \
  -H "X-Refresh-Token: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

You'll get a JSON response like:
```json
{"updated_securities": 34, "updated_returns_through": "2026-05-17", "skipped": [], "errors": []}
```

First run can take 30–60 seconds (it pulls ~250 trading days × 34 tickers from Yahoo). Subsequent daily runs only fetch the new day, so they finish in a few seconds.

---

## 6. Use the in-app editor

The frontend now has:

- **+ New Portfolio** button in the top bar — creates a new portfolio with strategy, currency, benchmark, inception date.
- **Pencil / Trash icons** next to the portfolio name in the top bar — edit or delete the active portfolio.
- **+ Add Holding** button on the Holdings page — enter a ticker (e.g. `AAPL`), the app looks it up via Yahoo Finance, then you fill in shares + cost basis.
- **Pencil / Trash icons** on each holdings row — edit quantity / cost basis / target weight, or remove the holding.

When you add a new ticker, the backend automatically:
1. Looks up the company name, sector, and exchange from Yahoo.
2. Backfills 365 days of close prices for that ticker.
3. Refolds the prices into the portfolio's daily returns curve.

---

## 7. (Optional) Set up UptimeRobot as a backup keepalive

GitHub's `*/10 * * * *` cron is reliable but not instant — sometimes runs are delayed. If you want a belt-and-suspenders ping every 5 minutes:

1. Sign up at [uptimerobot.com](https://uptimerobot.com/) (free plan, no card required).
2. **Add New Monitor** → **HTTP(s)**.
3. URL: `https://your-app.koyeb.app/api/health/keepalive`
4. Interval: 5 minutes.
5. Save.

If Koyeb ever spins your free-tier instance down, the next ping will wake it within ~5 seconds.

---

## What happens day-to-day

- **23:00 UTC daily** — GitHub Actions calls `/api/admin/refresh-prices`. Yahoo Finance returns yesterday's close for each of your tickers; the backend upserts the new row into `prices`, recomputes `portfolio_returns`, and re-stamps `holdings.market_value` + `holdings.weight`.
- **Every 10 minutes** — keepalive workflow hits `/api/health/keepalive`, which runs `SELECT 1` against Postgres and returns `{ok, db, last_refresh}`. This stops Koyeb's free-tier compute from sleeping.
- **On demand** — you open the dashboard, the frontend hits `/api/portfolios/.../summary` and gets a 5-minute browser-cached response.

---

## Checking that everything's healthy

```bash
# Backend awake + DB up + last refresh timestamp
curl https://your-app.koyeb.app/api/health/keepalive
```

Expected response:
```json
{"ok": true, "db": "up", "last_refresh": "2026-05-17"}
```

If `last_refresh` is null or more than a day old, check the **Actions** tab for failed workflow runs.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` on refresh | Token mismatch — verify `REFRESH_TOKEN` is identical in Koyeb env vars and GitHub Secrets. |
| `Ticker not found` when adding a holding | Yahoo Finance doesn't have that ticker. Try the exact Yahoo symbol (e.g. `BRK-B` not `BRK.B`, `RY.TO` for Canadian listings). |
| Holdings show stale market value | Trigger a manual refresh (Step 5) — yfinance occasionally throttles. |
| Cron ran but no data updated | Open `https://your-app.koyeb.app/api/health/keepalive`; if `db: down`, your Postgres slept — first ping wakes it, second ping should succeed. |
| GitHub Actions consuming too many private-repo minutes | Change keepalive cron from `*/10` to `*/15` in `.github/workflows/keepalive.yml` (4,320 → 2,880 min/month). |
| Want intraday updates instead of daily | Replace `yfinance` in `backend/app/services/market_data.py` with a paid provider (Polygon, Alpaca, Finnhub). The function signatures are the contract — no other code changes needed. |

---

## What's running where

```
+----------------------+         +------------------------------+
|  GitHub Actions      | daily   |  Koyeb (your backend)        |
|  refresh-prices.yml  |─────────▶  POST /api/admin/refresh-... |
|  23:00 UTC           |  HTTPS  |  -> yfinance -> Postgres      |
+----------------------+         +------------------------------+
+----------------------+ 10 min          ▲
|  keepalive.yml       |─────────────────┘ GET /api/health/keepalive
+----------------------+                  (also: UptimeRobot, optional)

+----------------------+
|  Vercel (frontend)   |  visitors  ──▶  https://your-app.koyeb.app/api/...
+----------------------+
```

Nothing else to do. The dashboard will keep itself current as long as those two GitHub Actions can run.
