import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export function KPICard({ label, value, subValue, change, changeLabel, icon }: KPICardProps) {
  const trendPill = () => {
    if (change === undefined) return null;
    const pct = `${change > 0 ? '+' : ''}${(change * 100).toFixed(2)}%`;
    if (change > 0) {
      return (
        <span className="clay-pill-mint flex items-center gap-1">
          <TrendingUp size={14} />
          {pct}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="clay-pill-coral flex items-center gap-1">
          <TrendingDown size={14} />
          {pct}
        </span>
      );
    }
    return (
      <span className="clay-pill-honey flex items-center gap-1">
        <Minus size={14} />
        {pct}
      </span>
    );
  };

  return (
    <div className="clay-card-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-clay-muted">{label}</p>
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-primarySoft text-clay-primary shadow-clay-sm">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-clay-ink">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {trendPill()}
        {changeLabel && (
          <span className="text-xs text-clay-muted">{changeLabel}</span>
        )}
        {subValue && change === undefined && (
          <span className="text-xs text-clay-muted">{subValue}</span>
        )}
      </div>
    </div>
  );
}
