import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchAttribution } from '../store/slices/analyticsSlice';
import { KPICard } from '../components/common/KPICard';
import { Term } from '../components/common/Term';
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
      render: (r) => <span className="font-mono text-xs font-semibold text-clay-ink">{r.ticker}</span>,
    },
    { key: 'name', header: 'Security', accessor: (r) => r.name },
    {
      key: 'sector',
      header: 'Sector',
      accessor: (r) => r.sector,
      render: (r) => (
        <span className="clay-pill">{r.sector}</span>
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
      render: (r) => <span className="font-medium text-clay-ink">{r.sector}</span>,
    },
    {
      key: 'portfolio_weight',
      header: 'Weight',
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-clay-ink">Attribution Analysis</h1>
        <p className="text-clay-muted">
          {attribution
            ? `${attribution.start_date} to ${attribution.end_date} · Period: ${attribution.period.toUpperCase()}`
            : 'Loading...'}
        </p>
      </div>

      {/* Top KPI row — 3 cards */}
      {loading.attribution ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : attribution ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KPICard
            label={<Term termKey="cumulativeReturn">Total Portfolio Return</Term> as unknown as string}
            value={formatPercent(attribution.total_return)}
            change={attribution.total_return}
          />
          {attribution.benchmark_return !== null && (
            <KPICard
              label={<Term termKey="benchmark">Benchmark Return</Term> as unknown as string}
              value={formatPercent(attribution.benchmark_return)}
              change={attribution.benchmark_return}
            />
          )}
          {attribution.excess_return !== null && (
            <KPICard
              label={<Term termKey="excessReturn">Excess Return</Term> as unknown as string}
              value={formatPercent(attribution.excess_return)}
              change={attribution.excess_return}
              changeLabel="active"
            />
          )}
        </div>
      ) : null}

      {/* Top / Bottom contributors side-by-side.
          ContributionChart renders its own clay-card with an unconditional title header.
          We use the chart's title prop for the literal text and add a Term-labelled
          section indicator above each card for tooltip accessibility. */}
      <div className="grid gap-6 lg:grid-cols-2">
        {loading.attribution ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : attribution ? (
          <>
            <div>
              <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-clay-muted">
                <Term termKey="topContributor">Top Contributors</Term>
              </p>
              <ContributionChart
                data={attribution.best_contributors.map((c) => ({
                  name: c.ticker,
                  value: c.return_contribution,
                }))}
                title="Top Contributors"
              />
            </div>
            <div>
              <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-clay-muted">
                <Term termKey="bottomContributor">Bottom Contributors</Term>
              </p>
              <ContributionChart
                data={attribution.worst_contributors.map((c) => ({
                  name: c.ticker,
                  value: c.return_contribution,
                }))}
                title="Bottom Contributors"
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Contribution by Sector chart */}
      {attribution && (
        <div>
          <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-clay-muted">
            <Term termKey="sectorAttribution">Contribution by Sector</Term>
          </p>
          <ContributionChart
            data={attribution.by_sector.map((s) => ({
              name: s.sector,
              value: s.portfolio_contribution,
            }))}
            title="Contribution by Sector"
          />
        </div>
      )}

      {/* Sector attribution table — DataTable renders its own clay-card with export button */}
      {attribution && (
        <DataTable<SectorAttribution>
          columns={sectorColumns}
          data={attribution.by_sector}
          title="Sector Attribution Detail"
          exportFilename={`sector_attribution_${attribution.portfolio_id}.csv`}
        />
      )}

      {/* Security-level attribution table */}
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
