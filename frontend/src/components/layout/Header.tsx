import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchPortfolios, deletePortfolio } from '../../store/slices/portfolioSlice';
import { setSelectedPortfolio, setPeriod } from '../../store/slices/filterSlice';
import { PeriodSelector } from '../common/PeriodSelector';
import { PortfolioFormModal } from '../modals/PortfolioFormModal';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import type { TimePeriod } from '../../types';

export function Header() {
  const dispatch = useAppDispatch();
  const { list, listLoading } = useAppSelector((s) => s.portfolio);
  const { selectedPortfolioId, period } = useAppSelector((s) => s.filters);

  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);
  const [editPortfolioOpen, setEditPortfolioOpen] = useState(false);
  const [deletePortfolioOpen, setDeletePortfolioOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPortfolios());
  }, [dispatch]);

  useEffect(() => {
    if (list.length > 0 && selectedPortfolioId === null) {
      dispatch(setSelectedPortfolio(list[0].id));
    }
  }, [list, selectedPortfolioId, dispatch]);

  const selected = list.find((p) => p.id === selectedPortfolioId);

  function handleDeleteConfirm() {
    if (!selectedPortfolioId) return;
    dispatch(deletePortfolio(selectedPortfolioId));
    setDeletePortfolioOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-20 clay-card rounded-none px-6 py-3 flex items-center justify-between shadow-clay-sm">
        <div className="flex items-center gap-2">
          {/* Portfolio switcher */}
          <div className="relative">
            <select
              value={selectedPortfolioId ?? ''}
              onChange={(e) => dispatch(setSelectedPortfolio(Number(e.target.value)))}
              disabled={listLoading}
              className="clay-select pr-8 text-sm font-semibold min-w-[180px]"
            >
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Edit / delete current portfolio */}
          {selected && (
            <>
              <button
                type="button"
                aria-label="Edit portfolio"
                className="clay-icon-button"
                onClick={() => setEditPortfolioOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Delete portfolio"
                className="clay-icon-button"
                onClick={() => setDeletePortfolioOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 text-clay-coral" />
              </button>
            </>
          )}

          {/* Strategy / benchmark chips */}
          {selected && (
            <div className="hidden items-center gap-2 sm:flex ml-2">
              <span className="clay-pill-sky">{selected.strategy}</span>
              {selected.benchmark_name && (
                <span className="text-xs text-clay-muted font-medium">
                  vs {selected.benchmark_name}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* New portfolio */}
          <button
            type="button"
            onClick={() => setNewPortfolioOpen(true)}
            className="clay-button flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Portfolio</span>
          </button>

          <PeriodSelector
            value={period}
            onChange={(p: TimePeriod) => dispatch(setPeriod(p))}
          />
        </div>
      </header>

      {/* Create portfolio modal */}
      <PortfolioFormModal
        open={newPortfolioOpen}
        onClose={() => setNewPortfolioOpen(false)}
      />

      {/* Edit portfolio modal */}
      {selected && (
        <PortfolioFormModal
          open={editPortfolioOpen}
          onClose={() => setEditPortfolioOpen(false)}
          initial={selected}
        />
      )}

      {/* Delete portfolio confirm */}
      <ConfirmDialog
        open={deletePortfolioOpen}
        onCancel={() => setDeletePortfolioOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Portfolio"
        body={
          selected
            ? `Permanently delete "${selected.name}"? All holdings and performance history will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
