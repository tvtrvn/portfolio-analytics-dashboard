import { useEffect } from 'react';
import {
  Wallet, TrendingUp, BarChart3, Activity, Gauge, ArrowDownToLine,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchPortfolioSummary } from '../store/slices/portfolioSlice';
import {
  fetchPerformance,
  fetchSectorAllocation,
  fetchAssetAllocation,
} from '../store/slices/analyticsSlice';
import { KPICard } from '../components/common/KPICard';
import { SkeletonCard, SkeletonChart } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { AllocationChart } from '../components/charts/AllocationChart';
import { DataTable, type Column } from '../components/common/DataTable';
import { Term } from '../components/common/Term';
import { formatCurrencyCompact, formatCurrency, formatPercent } from '../utils/format';
import type { HoldingItem } from '../types';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { summary, summaryLoading, error } = useAppSelector((s) => s.portfolio);
  const { performance, sectorAllocation, assetAllocation, loading } = useAppSelector((s) => s.analytics);
  const { selectedPortfolioId, period } = useAppSelector((s) => s.filters);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    dispatch(fetchPortfolioSummary({ id: selectedPortfolioId, period }));
    dispatch(fetchPerformance({ id: selectedPortfolioId, period }));
    dispatch(fetchSectorAllocation({ id: selectedPortfolioId }));
    dispatch(fetchAssetAllocation({ id: selectedPortfolioId }));
  }, [dispatch, selectedPortfolioId, period]);

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => selectedPortfolioId && dispatch(fetchPortfolioSummary({ id: selectedPortfolioId, period }))}
      />
    );
  }

  const topHoldingsColumns: Column<HoldingItem>[] = [
    {
      key: 'ticker',
      header: 'Ticker',
      accessor: (r) => r.ticker,
      render: (r) => <span className="font-mono font-semibold text-clay-ink">{r.ticker}</span>,
    },
    {
      key: 'name',
      header: 'Security',
      accessor: (r) => r.name,
      render: (r) => <span className="text-clay-ink">{r.name}</span>,
    },
    {
      key: 'sector',
      header: 'Sector',
      accessor: (r) => r.sector,
      render: (r) => <span className="clay-pill">{r.sector}</span>,
    },
    {
      key: 'weight',
      header: 'Weight',
      accessor: (r) => r.weight,
      align: 'right',
      render: (r) => <span className="font-mono font-medium">{formatPercent(r.weight)}</span>,
    },
    {
      key: 'market_value',
      header: 'Market Value',
      accessor: (r) => r.market_value,
      align: 'right',
      render: (r) => <span className="font-mono">{formatCurrency(r.market_value)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-clay-ink">Dashboard Overview</h1>
        <p className="text-sm text-clay-muted">
          {summary ? (
            <>
              <Term termKey="asOfDate">As of</Term>
              {' '}{summary.as_of_date}
              {' · '}{summary.portfolio.currency}
            </>
          ) : 'Loading...'}
        </p>
      </div>

      {/* KPI row — 6 cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard
            label="Total Market Value"
            value={formatCurrencyCompact(summary.total_market_value)}
            icon={<Wallet className="h-4 w-4" />}
          />
          <KPICard
            label="Daily Return"
            value={formatPercent(summary.daily_return)}
            change={summary.daily_return}
            changeLabel="today"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KPICard
            label="Cumulative Return"
            value={formatPercent(summary.cumulative_return)}
            change={summary.cumulative_return}
            changeLabel={period}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <KPICard
            label="Volatility"
            value={formatPercent(summary.volatility)}
            subValue="annualized"
            icon={<Activity className="h-4 w-4" />}
          />
          <KPICard
            label="Sharpe Ratio"
            value={summary.sharpe_ratio.toFixed(2)}
            subValue="risk-adjusted"
            icon={<Gauge className="h-4 w-4" />}
          />
          <KPICard
            label="Max Drawdown"
            value={formatPercent(summary.max_drawdown)}
            change={summary.max_drawdown}
            changeLabel="peak-to-trough"
            icon={<ArrowDownToLine className="h-4 w-4" />}
          />
        </div>
      ) : null}

      {/* Optional benchmark row */}
      {summary && summary.tracking_error !== null && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            label="Annualized Return"
            value={formatPercent(summary.annualized_return)}
            change={summary.annualized_return}
          />
          <KPICard
            label="Tracking Error"
            value={formatPercent(summary.tracking_error ?? 0)}
            subValue="vs benchmark"
          />
          <KPICard
            label="Information Ratio"
            value={(summary.information_ratio ?? 0).toFixed(2)}
            subValue="excess return / TE"
          />
          <div className="clay-card-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-clay-muted">
              <Term termKey="portfolioHealth">Portfolio Health</Term>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${
                summary.sharpe_ratio > 0.5 ? 'bg-clay-mint' :
                summary.sharpe_ratio > 0 ? 'bg-clay-honey' : 'bg-clay-coral'
              }`} />
              <span className="text-sm font-medium text-clay-ink">
                {summary.sharpe_ratio > 0.5 ? 'Healthy' :
                 summary.sharpe_ratio > 0 ? 'Monitor' : 'At Risk'}
              </span>
            </div>
            <p className="mt-1 text-xs text-clay-muted">
              Based on <Term termKey="sharpeRatio">Sharpe ratio</Term> and{' '}
              <Term termKey="maxDrawdown">drawdown</Term> levels
            </p>
          </div>
        </div>
      )}

      {/* Performance chart + Sector Allocation */}
      <div className="grid gap-6 lg:grid-cols-2">
        {loading.performance ? (
          <SkeletonChart />
        ) : performance ? (
          <div>
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <span className="text-sm font-semibold text-clay-ink">
                <Term termKey="cumulativeReturn">Portfolio vs Benchmark</Term>
              </span>
              <Term termKey="benchmark" iconOnly />
            </div>
            <PerformanceChart
              data={performance.series}
              title=""
              showBenchmark
            />
          </div>
        ) : null}

        <div className="grid gap-6">
          {loading.sectorAllocation ? (
            <SkeletonChart />
          ) : sectorAllocation ? (
            <div>
              <div className="mb-2 px-1">
                <span className="text-sm font-semibold text-clay-ink">
                  <Term termKey="sector">Sector</Term> Allocation
                </span>
              </div>
              <AllocationChart
                data={sectorAllocation.allocations.map((a) => ({
                  name: a.sector,
                  weight: a.weight,
                  market_value: a.market_value,
                }))}
                title="Sector Allocation"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Asset Class Allocation + Top Positions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {loading.assetAllocation ? (
          <SkeletonChart />
        ) : assetAllocation ? (
          <div>
            <div className="mb-2 px-1">
              <span className="text-sm font-semibold text-clay-ink">
                <Term termKey="assetClass">Asset Class</Term> Allocation
              </span>
            </div>
            <AllocationChart
              data={assetAllocation.allocations.map((a) => ({
                name: a.asset_class,
                weight: a.weight,
                market_value: a.market_value,
              }))}
              title="Asset Class Allocation"
            />
          </div>
        ) : null}

        {summary && summary.top_positions.length > 0 && (
          <div className="clay-card overflow-hidden">
            <div className="mb-4 flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-clay-ink">Top Positions</h3>
              <Term termKey="holding" iconOnly />
            </div>
            <DataTable<HoldingItem>
              columns={topHoldingsColumns}
              data={summary.top_positions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
