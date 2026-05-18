import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ReferenceLine, Area, AreaChart,
} from 'recharts';
import type { PerformancePoint } from '../../types';
import { formatDateShort } from '../../utils/format';

const PRIMARY = '#7C6FE8';
const SKY = '#6FB3E8';
const MINT = '#58C9A3';

interface PerformanceChartProps {
  data: PerformancePoint[];
  showBenchmark?: boolean;
  showExcess?: boolean;
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

export function PerformanceChart({ data, showBenchmark = true, showExcess = false, title }: PerformanceChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    portfolio: d.portfolio_return * 100,
    benchmark: d.benchmark_return !== null ? d.benchmark_return * 100 : null,
    excess: d.excess_return !== null ? d.excess_return * 100 : null,
  }));

  return (
    <div className="clay-card">
      {title && (
        <div className="border-b border-clay-border px-5 py-3">
          <h3 className="font-semibold text-clay-ink">{title}</h3>
        </div>
      )}
      <div className="p-5">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.25} />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
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
            <ReferenceLine y={0} stroke="#E8E0D2" strokeDasharray="2 2" />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="portfolio"
              name="Portfolio"
              stroke={PRIMARY}
              fill="url(#perfGrad)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {showBenchmark && (
              <Area
                type="monotone"
                dataKey="benchmark"
                name="Benchmark"
                stroke={SKY}
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            {showExcess && (
              <Area
                type="monotone"
                dataKey="excess"
                name="Excess Return"
                stroke={MINT}
                fill="none"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
