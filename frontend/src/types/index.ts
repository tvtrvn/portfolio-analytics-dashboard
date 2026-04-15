export interface Portfolio {
  id: number;
  name: string;
  strategy: string;
  currency: string;
  inception_date: string;
  description: string | null;
  benchmark_name: string | null;
}

export interface HoldingItem {
  ticker: string;
  name: string;
  sector: string;
  asset_class: string;
  weight: number;
  market_value: number;
  quantity: number;
  target_weight: number | null;
  weight_drift: number | null;
  return_contribution: number | null;
  cost_basis: number | null;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  total_market_value: number;
  daily_return: number;
  cumulative_return: number;
  annualized_return: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  tracking_error: number | null;
  information_ratio: number | null;
  top_positions: HoldingItem[];
  as_of_date: string;
}

export interface HoldingsResponse {
  portfolio_id: number;
  as_of_date: string;
  total_market_value: number;
  holdings: HoldingItem[];
}

export interface PerformancePoint {
  date: string;
  portfolio_return: number;
  benchmark_return: number | null;
  excess_return: number | null;
}

export interface PerformanceResponse {
  portfolio_id: number;
  period: string;
  start_date: string;
  end_date: string;
  cumulative_return: number;
  annualized_return: number;
  benchmark_cumulative_return: number | null;
  benchmark_annualized_return: number | null;
  excess_return: number | null;
  series: PerformancePoint[];
}

export interface SectorAllocation {
  sector: string;
  weight: number;
  market_value: number;
  benchmark_weight: number | null;
}

export interface SectorAllocationResponse {
  portfolio_id: number;
  as_of_date: string;
  allocations: SectorAllocation[];
}

export interface AssetAllocation {
  asset_class: string;
  weight: number;
  market_value: number;
}

export interface AssetAllocationResponse {
  portfolio_id: number;
  as_of_date: string;
  allocations: AssetAllocation[];
}

export interface SecurityAttribution {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
  return_contribution: number;
  benchmark_weight: number | null;
  relative_contribution: number | null;
}

export interface SectorAttribution {
  sector: string;
  portfolio_weight: number;
  benchmark_weight: number | null;
  portfolio_contribution: number;
  benchmark_contribution: number | null;
  allocation_effect: number | null;
  selection_effect: number | null;
  total_effect: number | null;
}

export interface AttributionResponse {
  portfolio_id: number;
  period: string;
  start_date: string;
  end_date: string;
  total_return: number;
  benchmark_return: number | null;
  excess_return: number | null;
  by_security: SecurityAttribution[];
  by_sector: SectorAttribution[];
  best_contributors: SecurityAttribution[];
  worst_contributors: SecurityAttribution[];
}

export interface BenchmarkComparisonResponse {
  portfolio_id: number;
  benchmark_name: string;
  period: string;
  portfolio_cumulative: number;
  benchmark_cumulative: number;
  excess_return: number;
  tracking_error: number;
  information_ratio: number;
  series: PerformancePoint[];
}

export interface RollingVolatilityPoint {
  date: string;
  vol_30d: number | null;
  vol_90d: number | null;
  benchmark_vol_30d: number | null;
  benchmark_vol_90d: number | null;
}

export interface DrawdownPoint {
  date: string;
  drawdown: number;
  benchmark_drawdown: number | null;
}

export interface RiskMetricsResponse {
  portfolio_id: number;
  period: string;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  max_drawdown_start: string | null;
  max_drawdown_end: string | null;
  var_95: number;
  cvar_95: number;
  beta: number | null;
  tracking_error: number | null;
  information_ratio: number | null;
  rolling_volatility: RollingVolatilityPoint[];
  drawdown_series: DrawdownPoint[];
}

export type TimePeriod = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'SI';
