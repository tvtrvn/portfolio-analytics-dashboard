import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';
import { formatPercent, formatCurrencyCompact } from '../../utils/format';

const COLORS = [
  '#334e68', '#486581', '#627d98', '#829ab1', '#9fb3c8',
  '#bcccdc', '#d9e2ec', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a78bfa', '#c4b5fd',
];

interface AllocationChartProps {
  data: { name: string; weight: number; market_value: number }[];
  title: string;
}

export function AllocationChart({ data, title }: AllocationChartProps) {
  const chartData = data
    .filter((d) => d.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map((d) => ({ ...d, pct: d.weight * 100 }));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="pct"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={1}
              stroke="none"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string, entry: any) => [
                `${value.toFixed(1)}% (${formatCurrencyCompact(entry?.payload?.market_value ?? 0)})`,
                name,
              ]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', lineHeight: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
