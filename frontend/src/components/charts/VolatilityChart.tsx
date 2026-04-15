import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { RollingVolatilityPoint } from '../../types';
import { formatDateShort } from '../../utils/format';

interface VolatilityChartProps {
  data: RollingVolatilityPoint[];
  title?: string;
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
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: any) => [value !== null ? `${Number(value).toFixed(2)}%` : '—', '']}
              labelFormatter={(label) => formatDateShort(label as string)}
            />
            <Legend verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="vol30" name="30-Day Vol" stroke="#334e68" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="vol90" name="90-Day Vol" stroke="#627d98" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="bVol30" name="Benchmark 30D" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
