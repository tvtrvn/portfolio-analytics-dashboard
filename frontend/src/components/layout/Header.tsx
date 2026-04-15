import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchPortfolios } from '../../store/slices/portfolioSlice';
import { setSelectedPortfolio, setPeriod } from '../../store/slices/filterSlice';
import { PeriodSelector } from '../common/PeriodSelector';
import type { TimePeriod } from '../../types';

export function Header() {
  const dispatch = useAppDispatch();
  const { list, listLoading } = useAppSelector((s) => s.portfolio);
  const { selectedPortfolioId, period } = useAppSelector((s) => s.filters);

  useEffect(() => {
    dispatch(fetchPortfolios());
  }, [dispatch]);

  useEffect(() => {
    if (list.length > 0 && selectedPortfolioId === null) {
      dispatch(setSelectedPortfolio(list[0].id));
    }
  }, [list, selectedPortfolioId, dispatch]);

  const selected = list.find((p) => p.id === selectedPortfolioId);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div>
          <select
            value={selectedPortfolioId ?? ''}
            onChange={(e) => dispatch(setSelectedPortfolio(Number(e.target.value)))}
            disabled={listLoading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-gray-800 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            {list.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {selected && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {selected.strategy}
            </span>
            {selected.benchmark_name && (
              <span className="text-xs text-gray-400">
                vs {selected.benchmark_name}
              </span>
            )}
          </div>
        )}
      </div>

      <PeriodSelector
        value={period}
        onChange={(p: TimePeriod) => dispatch(setPeriod(p))}
      />
    </header>
  );
}
