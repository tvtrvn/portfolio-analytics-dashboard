import { signColor } from '../../utils/format';

interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export function KPICard({ label, value, subValue, change, changeLabel, icon }: KPICardProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
          {icon && <span className="text-gray-400">{icon}</span>}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
        <div className="mt-1 flex items-center gap-2">
          {change !== undefined && (
            <span className={`text-xs font-medium ${signColor(change)}`}>
              {change > 0 ? '+' : ''}{(change * 100).toFixed(2)}%
            </span>
          )}
          {changeLabel && (
            <span className="text-xs text-gray-400">{changeLabel}</span>
          )}
          {subValue && !change && (
            <span className="text-xs text-gray-400">{subValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}
