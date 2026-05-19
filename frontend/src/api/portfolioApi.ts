import { api } from './client';
import type {
  Portfolio,
  PortfolioSummary,
  HoldingsResponse,
  PerformanceResponse,
  SectorAllocationResponse,
  AssetAllocationResponse,
  AttributionResponse,
  BenchmarkComparisonResponse,
  RiskMetricsResponse,
  PortfolioCreate,
  PortfolioUpdate,
  HoldingCreate,
  HoldingUpdate,
  SecurityRead,
  Holding,
} from '../types';

type QueryParams = Record<string, string | undefined>;

function periodParams(period?: string, startDate?: string, endDate?: string): QueryParams {
  return { period, start_date: startDate, end_date: endDate };
}

/** Build a `/portfolios/{id}/...` URL. */
function pUrl(id: number, path: string): string {
  return `/portfolios/${id}/${path}`;
}

export const portfolioApi = {
  listPortfolios: () =>
    api.get<Portfolio[]>('/portfolios'),

  getSummary: (id: number, period?: string) =>
    api.get<PortfolioSummary>(pUrl(id, 'summary'), periodParams(period)),

  getHoldings: (id: number, params?: { as_of_date?: string; sector?: string; asset_class?: string; search?: string }) =>
    api.get<HoldingsResponse>(pUrl(id, 'holdings'), params as QueryParams),

  getPerformance: (id: number, period?: string) =>
    api.get<PerformanceResponse>(pUrl(id, 'performance'), periodParams(period)),

  getSectorAllocation: (id: number, asOfDate?: string) =>
    api.get<SectorAllocationResponse>(pUrl(id, 'sector-allocation'), { as_of_date: asOfDate }),

  getAssetAllocation: (id: number, asOfDate?: string) =>
    api.get<AssetAllocationResponse>(pUrl(id, 'asset-allocation'), { as_of_date: asOfDate }),

  getAttribution: (id: number, period?: string) =>
    api.get<AttributionResponse>(pUrl(id, 'attribution'), periodParams(period)),

  getBenchmarkComparison: (id: number, period?: string) =>
    api.get<BenchmarkComparisonResponse>(pUrl(id, 'benchmark-comparison'), periodParams(period)),

  getRiskMetrics: (id: number, period?: string) =>
    api.get<RiskMetricsResponse>(pUrl(id, 'risk-metrics'), periodParams(period)),

  // Benchmarks (speculative — Agent B provides this endpoint)
  listBenchmarks: () =>
    api.get<{ id: number; name: string }[]>('/benchmarks'),

  // Portfolio CRUD
  createPortfolio: (body: PortfolioCreate) =>
    api.post<Portfolio>('/portfolios', body),

  updatePortfolio: (id: number, body: PortfolioUpdate) =>
    api.put<Portfolio>(`/portfolios/${id}`, body),

  deletePortfolio: (id: number) =>
    api.delete(`/portfolios/${id}`),

  // Securities
  listSecurities: () =>
    api.get<SecurityRead[]>('/securities'),

  lookupTicker: (ticker: string) =>
    api.get<SecurityRead>('/securities/lookup', { ticker }),

  // Holdings CRUD
  addHolding: (portfolioId: number, body: HoldingCreate) =>
    api.post<Holding>(pUrl(portfolioId, 'holdings'), body),

  updateHolding: (portfolioId: number, securityId: number, body: HoldingUpdate) =>
    api.put<Holding>(`${pUrl(portfolioId, 'holdings')}/${securityId}`, body),

  deleteHolding: (portfolioId: number, securityId: number) =>
    api.delete(`${pUrl(portfolioId, 'holdings')}/${securityId}`),
};
