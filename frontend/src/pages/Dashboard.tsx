import { useEffect } from 'react';
import {
  DollarSign, TrendingUp, Activity, BarChart3, ArrowDownRight, Target,
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
import { formatCurrencyCompact, formatCurrency, formatPercent, signColor } from '../utils/format';
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
      render: (r) => <span className="font-medium text-gray-900">{r.ticker}</span>,
    },
    { key: 'name', header: 'Name', accessor: (r) => r.name },
    { key: 'sector', header: 'Sector', accessor: (r) => r.sector },
    {
      key: 'weight',
      header: 'Weight',
      accessor: (r) => r.weight,
      align: 'right',
      render: (r) => formatPercent(r.weight),
    },
    {
      key: 'market_value',
      header: 'Market Value',
      accessor: (r) => r.market_value,
      align: 'right',
      render: (r) => formatCurrency(r.market_value),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="text-xs text-gray-500">
          {summary ? `As of ${summary.as_of_date} · ${summary.portfolio.currency}` : 'Loading...'}
        </p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard
            label="Total Market Value"
            value={formatCurrencyCompact(summary.total_market_value)}
            icon={<DollarSign className="h-4 w-4" />}
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
            icon={<Target className="h-4 w-4" />}
          />
          <KPICard
            label="Max Drawdown"
            value={formatPercent(summary.max_drawdown)}
            change={summary.max_drawdown}
            changeLabel="peak-to-trough"
            icon={<ArrowDownRight className="h-4 w-4" />}
          />
        </div>
      ) : null}

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
          <div className="card">
            <div className="card-body">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Portfolio Health
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  summary.sharpe_ratio > 0.5 ? 'bg-emerald-500' :
                  summary.sharpe_ratio > 0 ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium text-gray-800">
                  {summary.sharpe_ratio > 0.5 ? 'Healthy' :
                   summary.sharpe_ratio > 0 ? 'Monitor' : 'At Risk'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Based on Sharpe ratio and drawdown levels
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {loading.performance ? (
          <SkeletonChart />
        ) : performance ? (
          <PerformanceChart
            data={performance.series}
            title="Cumulative Performance"
            showBenchmark
          />
        ) : null}

        <div className="grid gap-6">
          {loading.sectorAllocation ? (
            <SkeletonChart />
          ) : sectorAllocation ? (
            <AllocationChart
              data={sectorAllocation.allocations.map((a) => ({
                name: a.sector,
                weight: a.weight,
                market_value: a.market_value,
              }))}
              title="Sector Allocation"
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {loading.assetAllocation ? (
          <SkeletonChart />
        ) : assetAllocation ? (
          <AllocationChart
            data={assetAllocation.allocations.map((a) => ({
              name: a.asset_class,
              weight: a.weight,
              market_value: a.market_value,
            }))}
            title="Asset Class Allocation"
          />
        ) : null}

        {summary && summary.top_positions.length > 0 && (
          <DataTable<HoldingItem>
            columns={topHoldingsColumns}
            data={summary.top_positions}
            title="Top 5 Positions"
          />
        )}
      </div>
    </div>
  );
}
