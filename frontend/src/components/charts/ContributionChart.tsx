import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine,
} from 'recharts';
import { formatPercent } from '../../utils/format';

const GAIN_COLOR = '#58C9A3';
const LOSS_COLOR = '#F08A7E';

interface ContributionChartProps {
  data: { name: string; value: number }[];
  title: string;
  layout?: 'horizontal' | 'vertical';
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-clay border border-clay-border bg-clay-surface p-3 text-sm shadow-clay-lg">
      <p className="text-xs text-clay-muted">{label}</p>
      <p className="font-mono font-semibold text-clay-ink">{formatPercent(payload[0].value)}</p>
    </div>
  );
}

export function ContributionChart({ data, title, layout = 'horizontal' }: ContributionChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="clay-card">
      <div className="border-b border-clay-border px-5 py-3">
        <h3 className="font-semibold text-clay-ink">{title}</h3>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={Math.max(280, sorted.length * 28)}>
          {layout === 'vertical' ? (
            <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D2" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                tick={{ fontSize: 11, fill: '#9C9388' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#9C9388' }}
                axisLine={false}
                tickLine={false}
                width={75}
              />
              <ReferenceLine x={0} stroke="#E8E0D2" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                {sorted.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? GAIN_COLOR : LOSS_COLOR} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={sorted} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D2" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9C9388' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                tick={{ fontSize: 11, fill: '#9C9388' }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <ReferenceLine y={0} stroke="#E8E0D2" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={24}>
                {sorted.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? GAIN_COLOR : LOSS_COLOR} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
