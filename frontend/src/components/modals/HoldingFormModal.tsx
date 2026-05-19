import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Term } from '../common/Term';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { addHolding, updateHolding, clearHoldingsMutateError } from '../../store/slices/holdingsSlice';
import { fetchSecurities } from '../../store/slices/securitiesSlice';
import type { HoldingItem, SecurityRead } from '../../types';

type Props = {
  open: boolean;
  onClose: () => void;
  portfolioId: number;
  initial?: HoldingItem;
};

type FormState = {
  ticker: string;
  quantity: string;
  cost_basis: string;
  target_weight: string;
  // new-ticker metadata
  name: string;
  sector: string;
  asset_class: string;
  currency: string;
  exchange: string;
};

function toForm(h?: HoldingItem): FormState {
  if (!h) {
    return { ticker: '', quantity: '', cost_basis: '', target_weight: '', name: '', sector: '', asset_class: '', currency: '', exchange: '' };
  }
  return {
    ticker: h.ticker,
    quantity: String(h.quantity),
    cost_basis: h.cost_basis !== null ? String(h.cost_basis) : '',
    target_weight: h.target_weight !== null ? String(h.target_weight) : '',
    name: '',
    sector: '',
    asset_class: '',
    currency: '',
    exchange: '',
  };
}

export function HoldingFormModal({ open, onClose, portfolioId, initial }: Props) {
  const dispatch = useAppDispatch();
  const { mutating, mutateError } = useAppSelector((s) => s.holdings);
  const { list: securities, loading: securitiesLoading } = useAppSelector((s) => s.securities);
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<FormState>(toForm(initial));
  const [tickerInput, setTickerInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [matchedSecurity, setMatchedSecurity] = useState<SecurityRead | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load securities list on first open
  useEffect(() => {
    if (open && securities.length === 0 && !securitiesLoading) {
      dispatch(fetchSecurities());
    }
  }, [open, securities.length, securitiesLoading, dispatch]);

  // Reset form on open
  useEffect(() => {
    if (open) {
      const f = toForm(initial);
      setForm(f);
      setTickerInput(initial?.ticker ?? '');
      setShowDropdown(false);
      setMatchedSecurity(null);
      dispatch(clearHoldingsMutateError());
    }
  }, [open, initial, dispatch]);

  // When editing, look up the preset match for the initial ticker
  useEffect(() => {
    if (open && initial && securities.length > 0) {
      const match = securities.find(
        (s) => s.ticker.toLowerCase() === initial.ticker.toLowerCase(),
      ) ?? null;
      setMatchedSecurity(match);
    }
  }, [open, initial, securities]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const filteredSecurities =
    tickerInput.trim().length === 0
      ? []
      : securities.filter(
          (s) =>
            s.ticker.toLowerCase().startsWith(tickerInput.toLowerCase()) ||
            s.name.toLowerCase().includes(tickerInput.toLowerCase()),
        ).slice(0, 10);

  const isNewTicker =
    !isEdit &&
    tickerInput.trim().length > 0 &&
    matchedSecurity === null &&
    !securitiesLoading;

  function handleTickerChange(value: string) {
    const upper = value.toUpperCase();
    setTickerInput(upper);
    setForm((prev) => ({ ...prev, ticker: upper }));
    setMatchedSecurity(null);
    setShowDropdown(true);
  }

  function handleSelectSecurity(sec: SecurityRead) {
    setTickerInput(sec.ticker);
    setForm((prev) => ({
      ...prev,
      ticker: sec.ticker,
      name: '',
      sector: '',
      asset_class: '',
      currency: '',
      exchange: '',
    }));
    setMatchedSecurity(sec);
    setShowDropdown(false);
  }

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ticker = form.ticker.trim().toUpperCase();
    const quantity = parseFloat(form.quantity);
    const cost_basis = form.cost_basis !== '' ? parseFloat(form.cost_basis) : undefined;
    const target_weight =
      form.target_weight !== '' ? parseFloat(form.target_weight) : undefined;

    if (!ticker || isNaN(quantity) || quantity <= 0) return;

    let result;
    if (isEdit && initial) {
      result = await dispatch(
        updateHolding({
          portfolioId,
          securityId: initial.security_id ?? 0,
          body: { ticker, quantity, cost_basis, target_weight },
        }),
      );
    } else {
      // Include metadata only for new tickers
      const metaFields =
        matchedSecurity === null
          ? {
              name: form.name || undefined,
              sector: form.sector || undefined,
              asset_class: form.asset_class || undefined,
              currency: form.currency || undefined,
              exchange: form.exchange || undefined,
            }
          : {};

      result = await dispatch(
        addHolding({
          portfolioId,
          body: { ticker, quantity, cost_basis, target_weight, ...metaFields },
        }),
      );
    }

    if (result.meta.requestStatus === 'fulfilled') {
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Holding' : 'Add Holding'}
      widthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Ticker autocomplete */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
            <Term termKey="ticker">Ticker</Term>
          </label>

          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              className="clay-input w-full font-mono uppercase"
              value={tickerInput}
              onChange={(e) => handleTickerChange(e.target.value)}
              onFocus={() => tickerInput.trim().length > 0 && setShowDropdown(true)}
              placeholder="e.g. AAPL"
              disabled={isEdit}
              autoFocus
              maxLength={10}
              autoComplete="off"
            />

            {/* Dropdown */}
            {showDropdown && filteredSecurities.length > 0 && (
              <div className="absolute z-50 mt-1 w-full clay-card shadow-clay-lg overflow-hidden max-h-52 overflow-y-auto">
                {filteredSecurities.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-clay-bg/60 transition-colors flex items-center justify-between gap-2"
                    onMouseDown={(e) => e.preventDefault()} // keep focus on input
                    onClick={() => handleSelectSecurity(sec)}
                  >
                    <span className="font-mono text-xs font-semibold text-clay-ink">{sec.ticker}</span>
                    <span className="text-xs text-clay-muted truncate">{sec.name}</span>
                    <span className="clay-pill shrink-0 text-[10px]">{sec.sector}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Matched preset preview */}
          {!isEdit && matchedSecurity && (
            <div className="clay-card-lifted p-3 mt-1 space-y-0.5">
              <p className="text-sm font-semibold text-clay-ink">{matchedSecurity.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="clay-pill">{matchedSecurity.sector}</span>
                <span className="clay-pill-sky">{matchedSecurity.asset_class}</span>
                {matchedSecurity.exchange && (
                  <span className="clay-pill-mint">{matchedSecurity.exchange}</span>
                )}
                <span className="clay-pill-honey">{matchedSecurity.currency}</span>
              </div>
            </div>
          )}

          {/* New ticker hint */}
          {isNewTicker && (
            <p className="text-xs text-clay-honey mt-1">
              New ticker — please fill in details below.
            </p>
          )}
        </div>

        {/* Metadata fields for new tickers */}
        {isNewTicker && (
          <div className="clay-card-lifted p-3 space-y-3">
            <p className="text-xs font-semibold text-clay-muted uppercase tracking-wide">Security Details</p>

            <div className="space-y-1">
              <label className="block text-xs text-clay-muted">Name *</label>
              <input
                type="text"
                className="clay-input w-full"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Apple Inc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs text-clay-muted">Sector *</label>
                <input
                  type="text"
                  className="clay-input w-full"
                  value={form.sector}
                  onChange={(e) => setField('sector', e.target.value)}
                  placeholder="e.g. Technology"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-clay-muted">Asset Class *</label>
                <input
                  type="text"
                  className="clay-input w-full"
                  value={form.asset_class}
                  onChange={(e) => setField('asset_class', e.target.value)}
                  placeholder="e.g. Equity"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs text-clay-muted">Currency *</label>
                <input
                  type="text"
                  className="clay-input w-full font-mono uppercase"
                  value={form.currency}
                  onChange={(e) => setField('currency', e.target.value.toUpperCase())}
                  placeholder="e.g. USD"
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-clay-muted">Exchange</label>
                <input
                  type="text"
                  className="clay-input w-full font-mono uppercase"
                  value={form.exchange}
                  onChange={(e) => setField('exchange', e.target.value.toUpperCase())}
                  placeholder="e.g. NASDAQ"
                  maxLength={20}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
            <Term termKey="quantity">Shares</Term>
          </label>
          <input
            type="number"
            className="clay-input w-full"
            value={form.quantity}
            onChange={(e) => setField('quantity', e.target.value)}
            placeholder="e.g. 100"
            min={0}
            step="any"
          />
        </div>

        {/* Cost Basis + Target Weight row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
              <Term termKey="costBasis">Cost Basis</Term>
              <span className="ml-1 font-normal text-clay-soft">(per share)</span>
            </label>
            <input
              type="number"
              className="clay-input w-full"
              value={form.cost_basis}
              onChange={(e) => setField('cost_basis', e.target.value)}
              placeholder="e.g. 150.00"
              min={0}
              step="any"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
              <Term termKey="targetWeight">Target Weight</Term>
            </label>
            <input
              type="number"
              className="clay-input w-full"
              value={form.target_weight}
              onChange={(e) => setField('target_weight', e.target.value)}
              placeholder="e.g. 0.05"
              min={0}
              max={1}
              step="0.01"
            />
            <p className="text-[10px] text-clay-soft">e.g. 0.05 for 5%</p>
          </div>
        </div>

        {/* API error */}
        {mutateError && (
          <p className="clay-pill-coral text-xs inline-block">{mutateError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="clay-button-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutating || !form.ticker.trim() || !form.quantity}
            className="clay-button"
          >
            {mutating ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Holding'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
