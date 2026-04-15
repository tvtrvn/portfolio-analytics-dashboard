import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  PieChart,
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/holdings', icon: Briefcase, label: 'Holdings' },
  { to: '/performance', icon: TrendingUp, label: 'Performance' },
  { to: '/attribution', icon: PieChart, label: 'Attribution' },
  { to: '/risk', icon: ShieldAlert, label: 'Risk Metrics' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white text-xs font-bold">
          PA
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">Portfolio Analytics</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-5 py-4">
        <p className="text-[10px] text-gray-400">
          TD Asset Management
        </p>
        <p className="text-[10px] text-gray-300">
          Internal Analytics Platform
        </p>
      </div>
    </aside>
  );
}
