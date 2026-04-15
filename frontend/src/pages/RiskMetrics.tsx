import { useEffect } from 'react';
import { ShieldAlert, Activity, TrendingDown, BarChart3, Target, Gauge } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchRiskMetrics } from '../store/slices/analyticsSlice';
import { KPICard } from '../components/common/KPICard';
import { SkeletonCard, SkeletonChart } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { DrawdownChart } from '../components/charts/DrawdownChart';
import { VolatilityChart } from '../components/charts/VolatilityChart';
import { formatPercent, formatDate } from '../utils/format';

export function RiskMetrics() {
  const dispatch = useAppDispatch();
  const { riskMetrics, loading, error } = useAppSelector((s) => s.analytics);
  const { selectedPortfolioId, period } = useAppSelector((s) => s.filters);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    dispatch(fetchRiskMetrics({ id: selectedPortfolioId, period }));
  }, [dispatch, selectedPortfolioId, period]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Risk Metrics</h1>
        <p className="text-xs text-gray-500">
          Comprehensive risk analysis and monitoring
        </p>
      </div>

      {loading.riskMetrics ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : riskMetrics ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <KPICard
              label="Annualized Volatility"
              value={formatPercent(riskMetrics.volatility)}
              subValue="std dev of returns"
              icon={<Activity className="h-4 w-4" />}
            />
            <KPICard
              label="Sharpe Ratio"
              value={riskMetrics.sharpe_ratio.toFixed(2)}
              subValue="risk-adjusted"
              icon={<Target className="h-4 w-4" />}
            />
            <KPICard
              label="Max Drawdown"
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
              label="VaR (95%)"
              value={formatPercent(Math.abs(riskMetrics.var_95))}
              subValue="daily, 1-day horizon"
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <KPICard
              label="CVaR (95%)"
              value={formatPercent(Math.abs(riskMetrics.cvar_95))}
              subValue="expected shortfall"
              icon={<BarChart3 className="h-4 w-4" />}
            />
            {riskMetrics.beta !== null && (
              <KPICard
                label="Beta"
                value={riskMetrics.beta.toFixed(2)}
                subValue="vs benchmark"
                icon={<Gauge className="h-4 w-4" />}
              />
            )}
          </div>

          {(riskMetrics.tracking_error !== null || riskMetrics.information_ratio !== null) && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {riskMetrics.tracking_error !== null && (
                <KPICard
                  label="Tracking Error"
                  value={formatPercent(riskMetrics.tracking_error)}
                  subValue="annualized TE"
                />
              )}
              {riskMetrics.information_ratio !== null && (
                <KPICard
                  label="Information Ratio"
                  value={riskMetrics.information_ratio.toFixed(2)}
                  subValue="excess return / TE"
                />
              )}
              <div className="card">
                <div className="card-body">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Risk Assessment
                  </p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Volatility</span>
                      <span className={`text-xs font-medium ${
                        riskMetrics.volatility < 0.12 ? 'text-emerald-600' :
                        riskMetrics.volatility < 0.20 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {riskMetrics.volatility < 0.12 ? 'Low' :
                         riskMetrics.volatility < 0.20 ? 'Moderate' : 'High'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Drawdown</span>
                      <span className={`text-xs font-medium ${
                        riskMetrics.max_drawdown > -0.10 ? 'text-emerald-600' :
                        riskMetrics.max_drawdown > -0.20 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {riskMetrics.max_drawdown > -0.10 ? 'Contained' :
                         riskMetrics.max_drawdown > -0.20 ? 'Elevated' : 'Severe'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Concentration Alert
                  </p>
                  <div className="mt-2">
                    {riskMetrics.beta !== null && riskMetrics.beta > 1.2 ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="text-xs text-gray-700">
                          Beta elevated ({riskMetrics.beta.toFixed(2)}x) — portfolio has above-market sensitivity
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs text-gray-700">
                          No concentration alerts
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
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
              title="Rolling Volatility"
            />
            <DrawdownChart
              data={riskMetrics.drawdown_series}
              title="Historical Drawdown"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
