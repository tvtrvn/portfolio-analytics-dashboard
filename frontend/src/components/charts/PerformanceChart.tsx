import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine,
} from 'recharts';
import type { PerformancePoint } from '../../types';
import { formatPercent, formatDateShort } from '../../utils/format';

interface PerformanceChartProps {
  data: PerformancePoint[];
  showBenchmark?: boolean;
  showExcess?: boolean;
  title?: string;
}

export function PerformanceChart({ data, showBenchmark = true, showExcess = false, title }: PerformanceChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    portfolio: d.portfolio_return * 100,
    benchmark: d.benchmark_return !== null ? d.benchmark_return * 100 : null,
    excess: d.excess_return !== null ? d.excess_return * 100 : null,
  }));

  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="card-body">
        <ResponsiveContainer width="100%" height={320}>
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
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="2 2" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
              labelFormatter={(label) => formatDateShort(label as string)}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="portfolio"
              name="Portfolio"
              stroke="#334e68"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                name="Benchmark"
                stroke="#829ab1"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            {showExcess && (
              <Line
                type="monotone"
                dataKey="excess"
                name="Excess Return"
                stroke="#059669"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
