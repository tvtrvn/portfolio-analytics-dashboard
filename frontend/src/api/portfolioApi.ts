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
  SecurityMetadata,
  Holding,
} from '../types';

type QueryParams = Record<string, string | undefined>;

function periodParams(period?: string, startDate?: string, endDate?: string): QueryParams {
  return { period, start_date: startDate, end_date: endDate };
}

export const portfolioApi = {
  listPortfolios: () =>
    api.get<Portfolio[]>('/portfolios'),

  getSummary: (id: number, period?: string) =>
    api.get<PortfolioSummary>(`/portfolios/${id}/summary`, periodParams(period)),

  getHoldings: (id: number, params?: { as_of_date?: string; sector?: string; asset_class?: string; search?: string }) =>
    api.get<HoldingsResponse>(`/portfolios/${id}/holdings`, params as QueryParams),

  getPerformance: (id: number, period?: string) =>
    api.get<PerformanceResponse>(`/portfolios/${id}/performance`, periodParams(period)),

  getSectorAllocation: (id: number, asOfDate?: string) =>
    api.get<SectorAllocationResponse>(`/portfolios/${id}/sector-allocation`, { as_of_date: asOfDate }),

  getAssetAllocation: (id: number, asOfDate?: string) =>
    api.get<AssetAllocationResponse>(`/portfolios/${id}/asset-allocation`, { as_of_date: asOfDate }),

  getAttribution: (id: number, period?: string) =>
    api.get<AttributionResponse>(`/portfolios/${id}/attribution`, periodParams(period)),

  getBenchmarkComparison: (id: number, period?: string) =>
    api.get<BenchmarkComparisonResponse>(`/portfolios/${id}/benchmark-comparison`, periodParams(period)),

  getRiskMetrics: (id: number, period?: string) =>
    api.get<RiskMetricsResponse>(`/portfolios/${id}/risk-metrics`, periodParams(period)),

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
  lookupTicker: (ticker: string) =>
    api.get<SecurityMetadata>('/securities/lookup', { ticker }),

  // Holdings CRUD
  addHolding: (portfolioId: number, body: HoldingCreate) =>
    api.post<Holding>(`/portfolios/${portfolioId}/holdings`, body),

  updateHolding: (portfolioId: number, securityId: number, body: HoldingUpdate) =>
    api.put<Holding>(`/portfolios/${portfolioId}/holdings/${securityId}`, body),

  deleteHolding: (portfolioId: number, securityId: number) =>
    api.delete(`/portfolios/${portfolioId}/holdings/${securityId}`),
};
