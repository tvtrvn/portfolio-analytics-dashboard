import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import type { DrawdownPoint } from '../../types';
import { formatDateShort } from '../../utils/format';

interface DrawdownChartProps {
  data: DrawdownPoint[];
  title?: string;
}

export function DrawdownChart({ data, title = 'Drawdown Analysis' }: DrawdownChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    drawdown: d.drawdown * 100,
    benchmark: d.benchmark_drawdown !== null ? d.benchmark_drawdown * 100 : null,
  }));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
              labelFormatter={(label) => formatDateShort(label as string)}
            />
            <Legend verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="drawdown"
              name="Portfolio Drawdown"
              stroke="#dc2626"
              fill="#fecaca"
              fillOpacity={0.3}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="benchmark"
              name="Benchmark Drawdown"
              stroke="#94a3b8"
              fill="#e2e8f0"
              fillOpacity={0.2}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
