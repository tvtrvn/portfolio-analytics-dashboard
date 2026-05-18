import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  fetchPerformance,
  fetchBenchmarkComparison,
  fetchRiskMetrics,
} from '../store/slices/analyticsSlice';
import { KPICard } from '../components/common/KPICard';
import { Term } from '../components/common/Term';
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-clay-ink">Performance Analytics</h1>
        <p className="text-clay-muted">
          {performance
            ? `${performance.start_date} to ${performance.end_date} · Period: ${performance.period.toUpperCase()}`
            : 'Loading...'}
        </p>
      </div>

      {/* KPI row — 6 cards */}
      {loading.performance ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {performance && (
            <>
              <KPICard
                label={<Term termKey="cumulativeReturn">Cumulative Return</Term> as unknown as string}
                value={formatPercent(performance.cumulative_return)}
                change={performance.cumulative_return}
              />
              <KPICard
                label={<Term termKey="annualizedReturn">Annualized Return</Term> as unknown as string}
                value={formatPercent(performance.annualized_return)}
                change={performance.annualized_return}
              />
              {performance.benchmark_cumulative_return !== null && (
                <KPICard
                  label={<Term termKey="benchmark">Benchmark Return</Term> as unknown as string}
                  value={formatPercent(performance.benchmark_cumulative_return)}
                  change={performance.benchmark_cumulative_return}
                />
              )}
              {performance.excess_return !== null && (
                <KPICard
                  label={<Term termKey="excessReturn">Excess Return</Term> as unknown as string}
                  value={formatPercent(performance.excess_return)}
                  change={performance.excess_return}
                  changeLabel="vs benchmark"
                />
              )}
            </>
          )}
          {benchmarkComparison && (
            <>
              <KPICard
                label={<Term termKey="trackingError">Tracking Error</Term> as unknown as string}
                value={formatPercent(benchmarkComparison.tracking_error)}
                subValue="annualized"
              />
              <KPICard
                label={<Term termKey="informationRatio">Information Ratio</Term> as unknown as string}
                value={benchmarkComparison.information_ratio.toFixed(2)}
                subValue="risk-adjusted alpha"
              />
            </>
          )}
        </div>
      )}

      {/* Performance vs Benchmark chart
          PerformanceChart renders its own clay-card with a conditional title header.
          We pass title="" so the chart's internal header is suppressed (it uses {title && …}),
          and render our Term-labelled legend row above the card instead. */}
      {loading.performance ? (
        <SkeletonChart />
      ) : performance ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-1">
            <h2 className="text-base font-semibold text-clay-ink">
              Performance vs <Term termKey="benchmark">Benchmark</Term>
            </h2>
            <div className="flex items-center gap-2">
              <span className="clay-pill-sky">Portfolio</span>
              <span className="clay-pill-mint">Benchmark</span>
              <span className="clay-pill-honey">Excess</span>
            </div>
          </div>
          <PerformanceChart
            data={performance.series}
            title=""
            showBenchmark
            showExcess
          />
        </div>
      ) : null}

      {/* Rolling Volatility + Drawdown side-by-side.
          VolatilityChart and DrawdownChart unconditionally render their title header,
          so we pass real strings and use Term-labelled spans within the visible chart titles
          by leveraging the chart's own title prop for the literal text. Term context is
          provided via the section label rendered above each chart card. */}
      <div className="grid gap-6 lg:grid-cols-2">
        {loading.riskMetrics ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : riskMetrics ? (
          <>
            <div>
              <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-clay-muted">
                <Term termKey="rollingVolatility">Rolling Volatility</Term>
              </p>
              <VolatilityChart
                data={riskMetrics.rolling_volatility}
                title="Rolling Volatility (30-Day & 90-Day)"
              />
            </div>
            <div>
              <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-clay-muted">
                <Term termKey="drawdown">Drawdown</Term> Analysis
              </p>
              <DrawdownChart
                data={riskMetrics.drawdown_series}
                title="Drawdown Analysis"
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
