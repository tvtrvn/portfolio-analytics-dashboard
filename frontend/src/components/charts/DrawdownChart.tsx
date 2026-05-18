import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import type { DrawdownPoint } from '../../types';
import { formatDateShort } from '../../utils/format';

interface DrawdownChartProps {
  data: DrawdownPoint[];
  title?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-clay border border-clay-border bg-clay-surface p-3 text-sm shadow-clay-lg">
      <p className="mb-1 text-xs text-clay-muted">{formatDateShort(label)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono font-semibold text-clay-ink">
          {p.name}: {p.value !== null ? `${Number(p.value).toFixed(2)}%` : '—'}
        </p>
      ))}
    </div>
  );
}

export function DrawdownChart({ data, title = 'Drawdown Analysis' }: DrawdownChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    drawdown: d.drawdown * 100,
    benchmark: d.benchmark_drawdown !== null ? d.benchmark_drawdown * 100 : null,
  }));

  return (
    <div className="clay-card">
      <div className="border-b border-clay-border px-5 py-3">
        <h3 className="font-semibold text-clay-ink">{title}</h3>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F08A7E" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F08A7E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ddBenchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9C9388" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#9C9388" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D2" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11, fill: '#9C9388' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              tick={{ fontSize: 11, fill: '#9C9388' }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <ReferenceLine y={0} stroke="#E8E0D2" />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="drawdown"
              name="Portfolio Drawdown"
              stroke="#F08A7E"
              fill="url(#ddGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="benchmark"
              name="Benchmark Drawdown"
              stroke="#9C9388"
              fill="url(#ddBenchGrad)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
