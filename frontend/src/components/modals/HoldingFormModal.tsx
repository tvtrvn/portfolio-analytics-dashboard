import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Term } from '../common/Term';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { addHolding, updateHolding, clearHoldingsMutateError } from '../../store/slices/holdingsSlice';
import { portfolioApi } from '../../api/portfolioApi';
import type { HoldingItem, SecurityMetadata } from '../../types';

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
};

function toForm(h?: HoldingItem): FormState {
  if (!h) {
    return { ticker: '', quantity: '', cost_basis: '', target_weight: '' };
  }
  return {
    ticker: h.ticker,
    quantity: String(h.quantity),
    cost_basis: h.cost_basis !== null ? String(h.cost_basis) : '',
    target_weight: h.target_weight !== null ? String(h.target_weight) : '',
  };
}

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; data: SecurityMetadata }
  | { status: 'notFound' }
  | { status: 'error' };

const DEBOUNCE_MS = 400;

export function HoldingFormModal({ open, onClose, portfolioId, initial }: Props) {
  const dispatch = useAppDispatch();
  const { mutating, mutateError } = useAppSelector((s) => s.holdings);
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<FormState>(toForm(initial));
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setForm(toForm(initial));
      setLookup({ status: 'idle' });
      dispatch(clearHoldingsMutateError());
    }
  }, [open, initial, dispatch]);

  // Debounced ticker lookup
  useEffect(() => {
    const ticker = form.ticker.trim().toUpperCase();
    if (!ticker || isEdit) {
      setLookup({ status: 'idle' });
      return;
    }

    setLookup({ status: 'loading' });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await portfolioApi.lookupTicker(ticker);
        setLookup({ status: 'found', data });
      } catch (err: unknown) {
        const isNotFound =
          err instanceof Error && err.message.toLowerCase().includes('404');
        setLookup(isNotFound ? { status: 'notFound' } : { status: 'error' });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.ticker, isEdit]);

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
      // For update, derive security_id from the holding. HoldingItem doesn't expose it
      // so we pass 0 and the backend should route by ticker within the portfolio.
      // Agent B: please confirm the securityId param for PUT /portfolios/:id/holdings/:securityId
      result = await dispatch(
        updateHolding({
          portfolioId,
          securityId: (initial as HoldingItem & { security_id?: number }).security_id ?? 0,
          body: { ticker, quantity, cost_basis, target_weight },
        }),
      );
    } else {
      result = await dispatch(
        addHolding({
          portfolioId,
          body: { ticker, quantity, cost_basis, target_weight },
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
        {/* Ticker */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
            <Term termKey="ticker">Ticker</Term>
          </label>
          <input
            type="text"
            className="clay-input w-full font-mono uppercase"
            value={form.ticker}
            onChange={(e) => setField('ticker', e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            disabled={isEdit}
            autoFocus
            maxLength={10}
          />

          {/* Ticker lookup preview */}
          {!isEdit && lookup.status === 'loading' && (
            <div className="clay-card-lifted p-3 mt-1">
              <div className="flex items-center gap-2 text-xs text-clay-muted">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-clay-primary animate-bounce [animation-delay:0ms]" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-clay-primary animate-bounce [animation-delay:150ms]" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-clay-primary animate-bounce [animation-delay:300ms]" />
                <span className="ml-1">Looking up ticker...</span>
              </div>
            </div>
          )}

          {!isEdit && lookup.status === 'found' && (
            <div className="clay-card-lifted p-3 mt-1 space-y-0.5">
              <p className="text-sm font-semibold text-clay-ink">{lookup.data.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="clay-pill">{lookup.data.sector}</span>
                <span className="clay-pill-sky">{lookup.data.asset_class}</span>
                <span className="clay-pill-mint">{lookup.data.exchange}</span>
                <span className="clay-pill-honey">{lookup.data.currency}</span>
              </div>
            </div>
          )}

          {!isEdit && lookup.status === 'notFound' && (
            <p className="text-xs text-clay-coral mt-1">Ticker not found.</p>
          )}

          {!isEdit && lookup.status === 'error' && (
            <p className="text-xs text-clay-coral mt-1">
              Could not look up ticker — you can still continue.
            </p>
          )}
        </div>

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
