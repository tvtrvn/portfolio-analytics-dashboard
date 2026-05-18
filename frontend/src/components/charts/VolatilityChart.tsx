import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { RollingVolatilityPoint } from '../../types';
import { formatDateShort } from '../../utils/format';

const PRIMARY = '#7C6FE8';
const SKY = '#6FB3E8';
const MUTED = '#9C9388';

interface VolatilityChartProps {
  data: RollingVolatilityPoint[];
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

export function VolatilityChart({ data, title = 'Rolling Volatility' }: VolatilityChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    vol30: d.vol_30d !== null ? d.vol_30d * 100 : null,
    vol90: d.vol_90d !== null ? d.vol_90d * 100 : null,
    bVol30: d.benchmark_vol_30d !== null ? d.benchmark_vol_30d * 100 : null,
    bVol90: d.benchmark_vol_90d !== null ? d.benchmark_vol_90d * 100 : null,
  }));

  return (
    <div className="clay-card">
      <div className="border-b border-clay-border px-5 py-3">
        <h3 className="font-semibold text-clay-ink">{title}</h3>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D2" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11, fill: MUTED }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fontSize: 11, fill: MUTED }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="vol30"
              name="30-Day Vol"
              stroke={PRIMARY}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="vol90"
              name="90-Day Vol"
              stroke={SKY}
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="bVol30"
              name="Benchmark 30D"
              stroke={MUTED}
              strokeWidth={1}
              strokeDasharray="4 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
