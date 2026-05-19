import { useEffect, useState } from 'react';
import { Search, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchHoldings, deleteHolding, clearHoldingsMutateError } from '../store/slices/holdingsSlice';
import { DataTable, type Column } from '../components/common/DataTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Term } from '../components/common/Term';
import { HoldingFormModal } from '../components/modals/HoldingFormModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { Toast } from '../components/common/Toast';
import { formatCurrency, formatPercent, formatCurrencyCompact } from '../utils/format';
import { downloadCsv } from '../utils/csv';
import type { HoldingItem } from '../types';

export function Holdings() {
  const dispatch = useAppDispatch();
  const { data, loading, error, mutateError } = useAppSelector((s) => s.holdings);
  const { selectedPortfolioId } = useAppSelector((s) => s.filters);

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [assetClassFilter, setAssetClassFilter] = useState('');

  // Modal state
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HoldingItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HoldingItem | null>(null);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    dispatch(fetchHoldings({
      id: selectedPortfolioId,
      search: search || undefined,
      sector: sectorFilter || undefined,
      asset_class: assetClassFilter || undefined,
    }));
  }, [dispatch, selectedPortfolioId, search, sectorFilter, assetClassFilter]);

  const sectors = data
    ? [...new Set(data.holdings.map((h) => h.sector))].sort()
    : [];
  const assetClasses = data
    ? [...new Set(data.holdings.map((h) => h.asset_class))].sort()
    : [];

  function handleDeleteConfirm() {
    if (!deleteTarget || !selectedPortfolioId) return;
    const securityId = deleteTarget.security_id ?? 0;
    dispatch(deleteHolding({ portfolioId: selectedPortfolioId, securityId }));
    setDeleteTarget(null);
  }

  function handleExportCsv() {
    if (!data) return;
    const headers = ['Ticker', 'Security Name', 'Sector', 'Asset Class', 'Weight', 'Target Weight', 'Drift', 'Market Value', 'Quantity'];
    const rows = data.holdings.map((h) => [
      h.ticker,
      h.name,
      h.sector,
      h.asset_class,
      formatPercent(h.weight),
      h.target_weight !== null ? formatPercent(h.target_weight) : '',
      h.weight_drift !== null ? formatPercent(h.weight_drift) : '',
      formatCurrency(h.market_value),
      h.quantity,
    ]);
    downloadCsv(`holdings_${data.portfolio_id}_${data.as_of_date}.csv`, headers, rows);
  }

  const columns: Column<HoldingItem>[] = [
    {
      key: 'ticker',
      header: 'Ticker',
      accessor: (r) => r.ticker,
      render: (r) => <span className="font-mono text-xs font-semibold text-clay-ink">{r.ticker}</span>,
    },
    {
      key: 'name',
      header: 'Security Name',
      accessor: (r) => r.name,
      render: (r) => <span className="text-clay-ink">{r.name}</span>,
    },
    {
      key: 'sector',
      header: 'Sector',
      accessor: (r) => r.sector,
      render: (r) => (
        <span className="clay-pill">{r.sector}</span>
      ),
    },
    {
      key: 'asset_class',
      header: 'Asset Class',
      accessor: (r) => r.asset_class,
      render: (r) => (
        <span className="text-xs text-clay-muted">{r.asset_class}</span>
      ),
    },
    {
      key: 'weight',
      header: 'Weight',
      accessor: (r) => r.weight,
      align: 'right',
      render: (r) => <span className="font-mono font-medium text-clay-ink">{formatPercent(r.weight)}</span>,
    },
    {
      key: 'target_weight',
      header: 'Target',
      accessor: (r) => r.target_weight ?? 0,
      align: 'right',
      render: (r) => (
        <span className="font-mono text-clay-muted">
          {r.target_weight !== null ? formatPercent(r.target_weight) : '—'}
        </span>
      ),
    },
    {
      key: 'drift',
      header: 'Drift',
      accessor: (r) => r.weight_drift ?? 0,
      align: 'right',
      render: (r) => {
        if (r.weight_drift === null) return <span className="font-mono text-clay-soft">—</span>;
        const abs = Math.abs(r.weight_drift);
        const colorClass =
          abs <= 0.005
            ? 'text-clay-mint'
            : abs <= 0.02
            ? 'text-clay-honey'
            : 'text-clay-coral';
        return (
          <span className={`font-mono text-xs font-medium ${colorClass}`}>
            {r.weight_drift > 0 ? '+' : ''}{formatPercent(r.weight_drift)}
          </span>
        );
      },
    },
    {
      key: 'market_value',
      header: 'Market Value',
      accessor: (r) => r.market_value,
      align: 'right',
      render: (r) => <span className="font-mono text-clay-ink">{formatCurrency(r.market_value)}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (r) => r.quantity,
      align: 'right',
      render: (r) => (
        <span className="font-mono text-clay-muted">
          {r.quantity.toLocaleString('en-CA', { maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: () => 0,
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${r.ticker}`}
            className="clay-icon-button"
            onClick={() => setEditTarget(r)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Remove ${r.ticker}`}
            className="clay-icon-button"
            onClick={() => setDeleteTarget(r)}
          >
            <Trash2 className="h-3.5 w-3.5 text-clay-coral" />
          </button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {mutateError && (
        <Toast
          message={mutateError}
          kind="error"
          onDismiss={() => dispatch(clearHoldingsMutateError())}
        />
      )}
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-clay-ink">Holdings</h1>
          <p className="text-sm text-clay-muted">
            {data
              ? (
                <>
                  {data.holdings.length} positions
                  {' · '}Total{' '}
                  <Term termKey="marketValue">market value</Term>
                  {': '}
                  {formatCurrencyCompact(data.total_market_value)}
                </>
              )
              : 'Loading...'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={!selectedPortfolioId}
          className="clay-button flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <Term termKey="holdingsEditor">Add Holding</Term>
        </button>
      </div>

      {/* Filter bar */}
      <div className="clay-card-lifted">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clay-soft" />
            <input
              type="text"
              placeholder="Search by ticker or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="clay-input pl-9"
            />
          </div>

          {/* Sector filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-clay-muted">
              <Term termKey="sector">Sector</Term>
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="clay-select"
            >
              <option value="">All Sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Asset class filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-clay-muted">
              <Term termKey="assetClass">Asset Class</Term>
            </label>
            <select
              value={assetClassFilter}
              onChange={(e) => setAssetClassFilter(e.target.value)}
              className="clay-select"
            >
              <option value="">All Asset Classes</option>
              {assetClasses.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {(sectorFilter || assetClassFilter || search) && (
            <button
              onClick={() => { setSectorFilter(''); setAssetClassFilter(''); setSearch(''); }}
              className="clay-button-ghost text-xs"
            >
              Clear filters
            </button>
          )}

          {/* Spacer + CSV export */}
          <div className="ml-auto">
            <button
              onClick={handleExportCsv}
              disabled={!data}
              className="clay-button flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <Term termKey="csvExport">Export CSV</Term>
            </button>
          </div>
        </div>
      </div>

      {/* Data table */}
      {loading ? (
        <LoadingSpinner />
      ) : data && data.holdings.length === 0 ? (
        <EmptyState title="No holdings found" message="Try adjusting your search or filters." />
      ) : data ? (
        <DataTable<HoldingItem>
          columns={columns}
          data={data.holdings}
        />
      ) : null}

      {/* Add holding modal */}
      {selectedPortfolioId !== null && (
        <HoldingFormModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          portfolioId={selectedPortfolioId}
        />
      )}

      {/* Edit holding modal */}
      {selectedPortfolioId !== null && editTarget && (
        <HoldingFormModal
          open={Boolean(editTarget)}
          onClose={() => setEditTarget(null)}
          portfolioId={selectedPortfolioId}
          initial={editTarget}
        />
      )}

      {/* Delete holding confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Holding"
        body={
          deleteTarget
            ? `Remove ${deleteTarget.ticker} (${deleteTarget.name}) from this portfolio? This cannot be undone.`
            : ''
        }
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
