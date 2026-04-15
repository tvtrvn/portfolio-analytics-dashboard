import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine,
} from 'recharts';
import { formatPercent } from '../../utils/format';

interface ContributionChartProps {
  data: { name: string; value: number }[];
  title: string;
  layout?: 'horizontal' | 'vertical';
}

export function ContributionChart({ data, title, layout = 'horizontal' }: ContributionChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={Math.max(280, sorted.length * 28)}>
          {layout === 'vertical' ? (
            <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={75}
              />
              <ReferenceLine x={0} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [formatPercent(value), 'Contribution']}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={16}>
                {sorted.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? '#059669' : '#dc2626'} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={sorted} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
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
                formatter={(value: number) => [formatPercent(value), 'Contribution']}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={24}>
                {sorted.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? '#059669' : '#dc2626'} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
