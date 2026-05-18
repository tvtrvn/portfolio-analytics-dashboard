import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from 'recharts';
import { formatCurrencyCompact } from '../../utils/format';

const COLORS = [
  '#7C6FE8', '#58C9A3', '#6FB3E8', '#F2C66B', '#F08A7E',
  '#A8C99E', '#F5A4C0', '#F7C8A8', '#C7BFF0',
];

interface AllocationChartProps {
  data: { name: string; weight: number; market_value: number }[];
  title: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-clay border border-clay-border bg-clay-surface p-3 text-sm shadow-clay-lg">
      <p className="text-xs text-clay-muted">{entry.name}</p>
      <p className="font-mono font-semibold text-clay-ink">
        {entry.value.toFixed(1)}% ({formatCurrencyCompact(entry.payload?.market_value ?? 0)})
      </p>
    </div>
  );
}

export function AllocationChart({ data, title }: AllocationChartProps) {
  const chartData = data
    .filter((d) => d.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map((d) => ({ ...d, pct: d.weight * 100 }));

  return (
    <div className="clay-card">
      <div className="border-b border-clay-border px-5 py-3">
        <h3 className="font-semibold text-clay-ink">{title}</h3>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="pct"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={108}
              paddingAngle={2}
              stroke="#FFFFFF"
              strokeWidth={3}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Clay-pill legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          {chartData.map((entry, i) => (
            <span
              key={entry.name}
              className="clay-pill flex items-center gap-1.5"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-clay-ink">{entry.name}</span>
              <span className="font-mono text-clay-muted">{entry.pct.toFixed(1)}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
