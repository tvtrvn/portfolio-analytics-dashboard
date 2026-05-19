import { useEffect, useRef } from 'react';
import { Term } from './Term';
import type { SecurityRead } from '../../types';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (sec: SecurityRead) => void;
  securities: SecurityRead[];
  disabled?: boolean;
  matchedSecurity: SecurityRead | null;
  showDropdown: boolean;
  onShowDropdown: (show: boolean) => void;
};

export function TickerAutocomplete({
  value,
  onChange,
  onSelect,
  securities,
  disabled,
  matchedSecurity,
  showDropdown,
  onShowDropdown,
}: Props) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown, onShowDropdown]);

  const filtered =
    value.trim().length === 0
      ? []
      : securities
          .filter(
            (s) =>
              s.ticker.toLowerCase().startsWith(value.toLowerCase()) ||
              s.name.toLowerCase().includes(value.toLowerCase()),
          )
          .slice(0, 10);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-clay-muted uppercase tracking-wide">
        <Term termKey="ticker">Ticker</Term>
      </label>

      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          className="clay-input w-full font-mono uppercase"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onFocus={() => value.trim().length > 0 && onShowDropdown(true)}
          placeholder="e.g. AAPL"
          disabled={disabled}
          autoFocus
          maxLength={10}
          autoComplete="off"
        />

        {showDropdown && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full clay-card shadow-clay-lg overflow-hidden max-h-52 overflow-y-auto">
            {filtered.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-clay-bg/60 transition-colors flex items-center justify-between gap-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(sec)}
              >
                <span className="font-mono text-xs font-semibold text-clay-ink">{sec.ticker}</span>
                <span className="text-xs text-clay-muted truncate">{sec.name}</span>
                <span className="clay-pill shrink-0 text-[10px]">{sec.sector}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {matchedSecurity && (
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
    </div>
  );
}
