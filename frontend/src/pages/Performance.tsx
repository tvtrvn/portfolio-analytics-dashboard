import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  fetchPerformance,
  fetchBenchmarkComparison,
  fetchRiskMetrics,
} from '../store/slices/analyticsSlice';
import { KPICard } from '../components/common/KPICard';
import { SkeletonCard, SkeletonChart } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { DrawdownChart } from '../components/charts/DrawdownChart';
import { VolatilityChart } from '../components/charts/VolatilityChart';
import { formatPercent } from '../utils/format';

export function Performance() {
  const dispatch = useAppDispatch();
  const { performance, benchmarkComparison, riskMetrics, loading, error } = useAppSelector((s) => s.analytics);
  const { selectedPortfolioId, period } = useAppSelector((s) => s.filters);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    dispatch(fetchPerformance({ id: selectedPortfolioId, period }));
    dispatch(fetchBenchmarkComparison({ id: selectedPortfolioId, period }));
    dispatch(fetchRiskMetrics({ id: selectedPortfolioId, period }));
  }, [dispatch, selectedPortfolioId, period]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Performance Analytics</h1>
        <p className="text-xs text-gray-500">
          {performance
            ? `${performance.start_date} to ${performance.end_date} · Period: ${performance.period.toUpperCase()}`
            : 'Loading...'}
        </p>
      </div>

      {loading.performance ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : performance ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            label="Cumulative Return"
            value={formatPercent(performance.cumulative_return)}
            change={performance.cumulative_return}
          />
          <KPICard
            label="Annualized Return"
            value={formatPercent(performance.annualized_return)}
            change={performance.annualized_return}
          />
          {performance.benchmark_cumulative_return !== null && (
            <KPICard
              label="Benchmark Return"
              value={formatPercent(performance.benchmark_cumulative_return)}
              change={performance.benchmark_cumulative_return}
            />
          )}
          {performance.excess_return !== null && (
            <KPICard
              label="Excess Return"
              value={formatPercent(performance.excess_return)}
              change={performance.excess_return}
              changeLabel="vs benchmark"
            />
          )}
        </div>
      ) : null}

      {benchmarkComparison && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            label="Tracking Error"
            value={formatPercent(benchmarkComparison.tracking_error)}
            subValue="annualized"
          />
          <KPICard
            label="Information Ratio"
            value={benchmarkComparison.information_ratio.toFixed(2)}
            subValue="risk-adjusted alpha"
          />
          <KPICard
            label="Portfolio Cumulative"
            value={formatPercent(benchmarkComparison.portfolio_cumulative)}
            change={benchmarkComparison.portfolio_cumulative}
          />
          <KPICard
            label="Benchmark Cumulative"
            value={formatPercent(benchmarkComparison.benchmark_cumulative)}
            change={benchmarkComparison.benchmark_cumulative}
          />
        </div>
      )}

      {loading.performance ? (
        <SkeletonChart />
      ) : performance ? (
        <PerformanceChart
          data={performance.series}
          title="Portfolio vs Benchmark Performance"
          showBenchmark
          showExcess
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {loading.riskMetrics ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : riskMetrics ? (
          <>
            <VolatilityChart
              data={riskMetrics.rolling_volatility}
              title="Rolling Volatility (30-Day & 90-Day)"
            />
            <DrawdownChart
              data={riskMetrics.drawdown_series}
              title="Drawdown Analysis"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
