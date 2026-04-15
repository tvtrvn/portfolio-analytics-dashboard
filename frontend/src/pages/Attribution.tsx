import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchAttribution } from '../store/slices/analyticsSlice';
import { KPICard } from '../components/common/KPICard';
import { SkeletonCard, SkeletonChart } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { ContributionChart } from '../components/charts/ContributionChart';
import { DataTable, type Column } from '../components/common/DataTable';
import { formatPercent, signColor } from '../utils/format';
import type { SecurityAttribution, SectorAttribution } from '../types';

export function Attribution() {
  const dispatch = useAppDispatch();
  const { attribution, loading, error } = useAppSelector((s) => s.analytics);
  const { selectedPortfolioId, period } = useAppSelector((s) => s.filters);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    dispatch(fetchAttribution({ id: selectedPortfolioId, period }));
  }, [dispatch, selectedPortfolioId, period]);

  if (error) return <ErrorState message={error} />;

  const securityColumns: Column<SecurityAttribution>[] = [
    {
      key: 'ticker',
      header: 'Ticker',
      accessor: (r) => r.ticker,
      render: (r) => <span className="font-mono text-xs font-semibold text-gray-900">{r.ticker}</span>,
    },
    { key: 'name', header: 'Security', accessor: (r) => r.name },
    {
      key: 'sector',
      header: 'Sector',
      accessor: (r) => r.sector,
      render: (r) => (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{r.sector}</span>
      ),
    },
    {
      key: 'weight',
      header: 'Weight',
      accessor: (r) => r.weight,
      align: 'right',
      render: (r) => formatPercent(r.weight),
    },
    {
      key: 'return_contribution',
      header: 'Contribution',
      accessor: (r) => r.return_contribution,
      align: 'right',
      render: (r) => (
        <span className={`font-medium ${signColor(r.return_contribution)}`}>
          {r.return_contribution > 0 ? '+' : ''}{formatPercent(r.return_contribution)}
        </span>
      ),
    },
  ];

  const sectorColumns: Column<SectorAttribution>[] = [
    {
      key: 'sector',
      header: 'Sector',
      accessor: (r) => r.sector,
      render: (r) => <span className="font-medium text-gray-900">{r.sector}</span>,
    },
    {
      key: 'portfolio_weight',
      header: 'Portfolio Weight',
      accessor: (r) => r.portfolio_weight,
      align: 'right',
      render: (r) => formatPercent(r.portfolio_weight),
    },
    {
      key: 'portfolio_contribution',
      header: 'Contribution',
      accessor: (r) => r.portfolio_contribution,
      align: 'right',
      render: (r) => (
        <span className={`font-medium ${signColor(r.portfolio_contribution)}`}>
          {r.portfolio_contribution > 0 ? '+' : ''}{formatPercent(r.portfolio_contribution)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Attribution Analysis</h1>
        <p className="text-xs text-gray-500">
          {attribution
            ? `${attribution.start_date} to ${attribution.end_date} · Period: ${attribution.period.toUpperCase()}`
            : 'Loading...'}
        </p>
      </div>

      {loading.attribution ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : attribution ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KPICard
            label="Total Portfolio Return"
            value={formatPercent(attribution.total_return)}
            change={attribution.total_return}
          />
          {attribution.benchmark_return !== null && (
            <KPICard
              label="Benchmark Return"
              value={formatPercent(attribution.benchmark_return)}
              change={attribution.benchmark_return}
            />
          )}
          {attribution.excess_return !== null && (
            <KPICard
              label="Excess Return"
              value={formatPercent(attribution.excess_return)}
              change={attribution.excess_return}
              changeLabel="active"
            />
          )}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {loading.attribution ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : attribution ? (
          <>
            <ContributionChart
              data={attribution.best_contributors.map((c) => ({
                name: c.ticker,
                value: c.return_contribution,
              }))}
              title="Top Contributors"
            />
            <ContributionChart
              data={attribution.worst_contributors.map((c) => ({
                name: c.ticker,
                value: c.return_contribution,
              }))}
              title="Bottom Contributors"
            />
          </>
        ) : null}
      </div>

      {attribution && (
        <ContributionChart
          data={attribution.by_sector.map((s) => ({
            name: s.sector,
            value: s.portfolio_contribution,
          }))}
          title="Contribution by Sector"
        />
      )}

      {attribution && (
        <DataTable<SectorAttribution>
          columns={sectorColumns}
          data={attribution.by_sector}
          title="Sector Attribution Detail"
          exportFilename={`sector_attribution_${attribution.portfolio_id}.csv`}
        />
      )}

      {attribution && (
        <DataTable<SecurityAttribution>
          columns={securityColumns}
          data={attribution.by_security}
          title="Security-Level Attribution"
          exportFilename={`security_attribution_${attribution.portfolio_id}.csv`}
        />
      )}
    </div>
  );
}
