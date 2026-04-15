import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Holdings } from './pages/Holdings';
import { Performance } from './pages/Performance';
import { Attribution } from './pages/Attribution';
import { RiskMetrics } from './pages/RiskMetrics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/attribution" element={<Attribution />} />
          <Route path="/risk" element={<RiskMetrics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
