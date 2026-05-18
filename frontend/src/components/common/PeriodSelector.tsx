import type { TimePeriod } from '../../types';

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1Y' },
  { value: 'SI', label: 'Since Inception' },
];

interface PeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="clay-card-lifted inline-flex flex-wrap gap-1 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={value === p.value ? 'clay-tab-active' : 'clay-tab'}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
