import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  LineChart,
  PieChart,
  Shield,
  TrendingUp,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/holdings', icon: Wallet, label: 'Holdings' },
  { to: '/performance', icon: LineChart, label: 'Performance' },
  { to: '/attribution', icon: PieChart, label: 'Attribution' },
  { to: '/risk', icon: Shield, label: 'Risk Metrics' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-72 flex-col bg-clay-surface shadow-clay">
      {/* Logo block */}
      <div className="px-5 pt-6 pb-4">
        <div className="clay-card-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-clay bg-clay-primarySoft">
            <TrendingUp className="h-6 w-6 text-clay-primary" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold text-clay-ink leading-tight">Portfolio Analytics</p>
            <p className="text-[10px] text-clay-muted font-medium uppercase tracking-widest">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-4 py-2">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-clay-soft">
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-clay-primarySoft text-clay-primaryDeep shadow-clay-sm font-semibold'
                  : 'text-clay-muted hover:bg-clay-surface2 hover:text-clay-ink font-medium'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom tag */}
      <div className="px-5 pb-6 pt-2">
        <span className="clay-pill">Demo data</span>
      </div>
    </aside>
  );
}
