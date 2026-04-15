import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchHoldings } from '../store/slices/holdingsSlice';
import { DataTable, type Column } from '../components/common/DataTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatPercent, signColor, formatCurrencyCompact } from '../utils/format';
import type { HoldingItem } from '../types';

export function Holdings() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((s) => s.holdings);
  const { selectedPortfolioId } = useAppSelector((s) => s.filters);

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [assetClassFilter, setAssetClassFilter] = useState('');

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

  const columns: Column<HoldingItem>[] = [
    {
      key: 'ticker',
      header: 'Ticker',
      accessor: (r) => r.ticker,
      render: (r) => <span className="font-mono text-xs font-semibold text-gray-900">{r.ticker}</span>,
    },
    {
      key: 'name',
      header: 'Security Name',
      accessor: (r) => r.name,
      render: (r) => <span className="text-gray-700">{r.name}</span>,
    },
    {
      key: 'sector',
      header: 'Sector',
      accessor: (r) => r.sector,
      render: (r) => (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{r.sector}</span>
      ),
    },
    {
      key: 'asset_class',
      header: 'Asset Class',
      accessor: (r) => r.asset_class,
      render: (r) => (
        <span className="text-xs text-gray-500">{r.asset_class}</span>
      ),
    },
    {
      key: 'weight',
      header: 'Weight',
      accessor: (r) => r.weight,
      align: 'right',
      render: (r) => <span className="font-medium">{formatPercent(r.weight)}</span>,
    },
    {
      key: 'target_weight',
      header: 'Target',
      accessor: (r) => r.target_weight ?? 0,
      align: 'right',
      render: (r) => r.target_weight !== null ? formatPercent(r.target_weight) : '—',
    },
    {
      key: 'drift',
      header: 'Drift',
      accessor: (r) => r.weight_drift ?? 0,
      align: 'right',
      render: (r) => {
        if (r.weight_drift === null) return '—';
        return (
          <span className={`text-xs font-medium ${signColor(r.weight_drift)}`}>
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
      render: (r) => formatCurrency(r.market_value),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (r) => r.quantity,
      align: 'right',
      render: (r) => r.quantity.toLocaleString('en-CA', { maximumFractionDigits: 0 }),
    },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Holdings & Exposures</h1>
          <p className="text-xs text-gray-500">
            {data ? `${data.holdings.length} positions · ${data.as_of_date} · Total: ${formatCurrencyCompact(data.total_market_value)}` : 'Loading...'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ticker or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>

        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={assetClassFilter}
          onChange={(e) => setAssetClassFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="">All Asset Classes</option>
          {assetClasses.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {(sectorFilter || assetClassFilter || search) && (
          <button
            onClick={() => { setSectorFilter(''); setAssetClassFilter(''); setSearch(''); }}
            className="text-xs text-brand-600 hover:text-brand-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data && data.holdings.length === 0 ? (
        <EmptyState title="No holdings found" message="Try adjusting your search or filters." />
      ) : data ? (
        <DataTable<HoldingItem>
          columns={columns}
          data={data.holdings}
          exportFilename={`holdings_${data.portfolio_id}_${data.as_of_date}.csv`}
        />
      ) : null}
    </div>
  );
}
