import { useEffect } from 'react';
import { ShieldAlert, Activity, TrendingDown, BarChart3, Target, Gauge } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchRiskMetrics } from '../store/slices/analyticsSlice';
import { KPICard } from '../components/common/KPICard';
import { Term } from '../components/common/Term';
import { SkeletonCard, SkeletonChart } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { DrawdownChart } from '../components/charts/DrawdownChart';
import { VolatilityChart } from '../components/charts/VolatilityChart';
import { formatPercent } from '../utils/format';

export function RiskMetrics() {
  const dispatch = useAppDispatch();
  const { riskMetrics, loading, error } = useAppSelector((s) => s.analytics);
  const { selectedPortfolioId, period } = useAppSelector((s) => s.filters);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    dispatch(fetchRiskMetrics({ id: selectedPortfolioId, period }));
  }, [dispatch, selectedPortfolioId, period]);

  if (error) return <ErrorState message={error} />;

  const volatilityPill =
    riskMetrics
      ? riskMetrics.volatility < 0.12
        ? { label: 'Low', cls: 'clay-pill-mint' }
        : riskMetrics.volatility < 0.20
        ? { label: 'Moderate', cls: 'clay-pill-honey' }
        : { label: 'High', cls: 'clay-pill-coral' }
      : { label: '—', cls: 'clay-pill' };

  const drawdownPill =
    riskMetrics
      ? riskMetrics.max_drawdown > -0.10
        ? { label: 'Contained', cls: 'clay-pill-mint' }
        : riskMetrics.max_drawdown > -0.20
        ? { label: 'Elevated', cls: 'clay-pill-honey' }
        : { label: 'Severe', cls: 'clay-pill-coral' }
      : { label: '—', cls: 'clay-pill' };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-clay-ink">Risk Metrics</h1>
        <p className="text-clay-muted">
          Comprehensive risk analysis and monitoring
        </p>
      </div>

      {/* Primary KPI row — 6 cards */}
      {loading.riskMetrics ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : riskMetrics ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <KPICard
              label={<Term termKey="annualizedVolatility">Annualized Volatility</Term> as unknown as string}
              value={formatPercent(riskMetrics.volatility)}
              subValue="std dev of returns"
              icon={<Activity className="h-4 w-4" />}
            />
            <KPICard
              label={<Term termKey="sharpeRatio">Sharpe Ratio</Term> as unknown as string}
              value={riskMetrics.sharpe_ratio.toFixed(2)}
              subValue="risk-adjusted"
              icon={<Target className="h-4 w-4" />}
            />
            <KPICard
              label={<Term termKey="maxDrawdown">Max Drawdown</Term> as unknown as string}
              value={formatPercent(riskMetrics.max_drawdown)}
              change={riskMetrics.max_drawdown}
              changeLabel={
                riskMetrics.max_drawdown_start && riskMetrics.max_drawdown_end
                  ? `${riskMetrics.max_drawdown_start} → ${riskMetrics.max_drawdown_end}`
                  : 'peak-to-trough'
              }
              icon={<TrendingDown className="h-4 w-4" />}
            />
            <KPICard
              label={<Term termKey="var">VaR (95%)</Term> as unknown as string}
              value={formatPercent(Math.abs(riskMetrics.var_95))}
              subValue="daily, 1-day horizon"
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <KPICard
              label={<Term termKey="cvar">CVaR (95%)</Term> as unknown as string}
              value={formatPercent(Math.abs(riskMetrics.cvar_95))}
              subValue="expected shortfall"
              icon={<BarChart3 className="h-4 w-4" />}
            />
            {riskMetrics.beta !== null && (
              <KPICard
                label={<Term termKey="beta">Beta</Term> as unknown as string}
                value={riskMetrics.beta.toFixed(2)}
                subValue="vs benchmark"
                icon={<Gauge className="h-4 w-4" />}
              />
            )}
          </div>

          {/* Secondary row — 4 cards */}
          {(riskMetrics.tracking_error !== null || riskMetrics.information_ratio !== null) && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {riskMetrics.tracking_error !== null && (
                <KPICard
                  label={<Term termKey="trackingError">Tracking Error</Term> as unknown as string}
                  value={formatPercent(riskMetrics.tracking_error)}
                  subValue="annualized TE"
                />
              )}
              {riskMetrics.information_ratio !== null && (
                <KPICard
                  label={<Term termKey="informationRatio">Information Ratio</Term> as unknown as string}
                  value={riskMetrics.information_ratio.toFixed(2)}
                  subValue="excess return / TE"
                />
              )}

              {/* Risk Assessment card */}
              <div className="clay-card-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-clay-muted">
                  <Term termKey="riskAssessment">Risk Assessment</Term>
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-clay-muted">
                      <Term termKey="volatility">Volatility</Term>
                    </span>
                    <span className={volatilityPill.cls}>{volatilityPill.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-clay-muted">
                      <Term termKey="drawdown">Drawdown</Term>
                    </span>
                    <span className={drawdownPill.cls}>{drawdownPill.label}</span>
                  </div>
                </div>
              </div>

              {/* Concentration card */}
              <div className="clay-card-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-clay-muted">
                  <Term termKey="concentration">Concentration</Term>
                </p>
                <div className="mt-3">
                  {riskMetrics.beta !== null && riskMetrics.beta > 1.2 ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-clay-honey" />
                      <span className="text-xs text-clay-muted">
                        <Term termKey="beta">Beta</Term> elevated ({riskMetrics.beta.toFixed(2)}x) — above-market sensitivity
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-clay-mint" />
                      <span className="text-xs text-clay-muted">
                        No concentration alerts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Rolling Volatility + Historical Drawdown side-by-side.
          VolatilityChart and DrawdownChart unconditionally render their title header,
          so we pass real strings for chart internals and add Term-labelled section
          indicators above each card for tooltip accessibility. */}
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
                title="Rolling Volatility"
              />
            </div>
            <div>
              <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-clay-muted">
                Historical <Term termKey="drawdown">Drawdown</Term>
              </p>
              <DrawdownChart
                data={riskMetrics.drawdown_series}
                title="Historical Drawdown"
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
