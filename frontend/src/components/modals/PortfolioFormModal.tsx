import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Term } from '../common/Term';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { createPortfolio, updatePortfolio, clearMutateError } from '../../store/slices/portfolioSlice';
import { portfolioApi } from '../../api/portfolioApi';
import type { Portfolio, PortfolioCreate } from '../../types';

type Benchmark = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Portfolio;
};

const STRATEGIES = [
  'Growth Equity',
  'Balanced Income',
  'Canadian Dividend',
  'Global Macro',
  'Custom',
];

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP'];

function emptyForm(): PortfolioCreate {
  return {
    name: '',
    strategy: STRATEGIES[0],
    benchmark_id: undefined,
    inception_date: '',
    currency: 'USD',
    description: '',
  };
}

function portfolioToForm(p: Portfolio): PortfolioCreate {
  return {
    name: p.name,
    strategy: p.strategy,
    benchmark_id: undefined, // benchmark_id not exposed on Portfolio — leave as optional
    inception_date: p.inception_date,
    currency: p.currency,
    description: p.description ?? '',
  };
}

export function PortfolioFormModal({ open, onClose, initial }: Props) {
  const dispatch = useAppDispatch();
  const { mutating, mutateError } = useAppSelector((s) => s.portfolio);
  const isEdit = Boolean(initial);

  const [form, setForm] = useState<PortfolioCreate>(emptyForm);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [nameError, setNameError] = useState('');

  // Populate form when modal opens
  useEffect(() => {
    if (open) {
      setForm(initial ? portfolioToForm(initial) : emptyForm());
      setNameError('');
      dispatch(clearMutateError());
    }
  }, [open, initial, dispatch]);

  // Load benchmarks once on first open
  useEffect(() => {
    if (!open || benchmarks.length > 0) return;
    portfolioApi
      .listBenchmarks()
      .then((data: Benchmark[]) => setBenchmarks(data))
      .catch(() => {
        // Fallback static list if endpoint not yet available
        setBenchmarks([
          { id: 1, name: 'S&P 500' },
          { id: 2, name: 'S&P/TSX Composite' },
          { id: 3, name: 'FTSE Canada Bond Index' },
          { id: 4, name: 'MSCI World' },
        ]);
      });
  }, [open, benchmarks.length]);

  function set<K extends keyof PortfolioCreate>(key: K, value: PortfolioCreate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Portfolio name is required.');
      return;
    }
    setNameError('');

    const body: PortfolioCreate = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      benchmark_id: form.benchmark_id || undefined,
    };

    let result;
    if (isEdit && initial) {
      result = await dispatch(updatePortfolio({ id: initial.id, body }));
    } else {
      result = await dispatch(createPortfolio(body));
    }

    if (result.meta.requestStatus === 'fulfilled') {
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Portfolio' : 'New Portfolio'}
      widthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
            Name
          </label>
          <input
            type="text"
            className="clay-input w-full"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. My Growth Portfolio"
            autoFocus
          />
          {nameError && (
            <p className="clay-pill-coral text-xs inline-block mt-1">{nameError}</p>
          )}
        </div>

        {/* Strategy */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
            <Term termKey="strategy">Strategy</Term>
          </label>
          <select
            className="clay-select w-full"
            value={form.strategy}
            onChange={(e) => set('strategy', e.target.value)}
          >
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Benchmark */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
            <Term termKey="benchmark">Benchmark</Term>
            <span className="ml-1 font-normal text-clay-soft">(optional)</span>
          </label>
          <select
            className="clay-select w-full"
            value={form.benchmark_id ?? ''}
            onChange={(e) =>
              set('benchmark_id', e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">None</option>
            {benchmarks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Inception Date + Currency row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
              <Term termKey="inceptionDate">Inception Date</Term>
            </label>
            <input
              type="date"
              className="clay-input w-full"
              value={form.inception_date}
              onChange={(e) => set('inception_date', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
              <Term termKey="currency">Currency</Term>
            </label>
            <select
              className="clay-select w-full"
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
            Description
            <span className="ml-1 font-normal text-clay-soft">(optional)</span>
          </label>
          <textarea
            className="clay-input w-full resize-none"
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Brief description of the portfolio's goals..."
          />
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
          <button type="submit" disabled={mutating} className="clay-button">
            {mutating ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Portfolio'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
