import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { portfolioApi } from '../../api/portfolioApi';
import type {
  PerformanceResponse,
  SectorAllocationResponse,
  AssetAllocationResponse,
  AttributionResponse,
  BenchmarkComparisonResponse,
  RiskMetricsResponse,
} from '../../types';

interface AnalyticsState {
  performance: PerformanceResponse | null;
  sectorAllocation: SectorAllocationResponse | null;
  assetAllocation: AssetAllocationResponse | null;
  attribution: AttributionResponse | null;
  benchmarkComparison: BenchmarkComparisonResponse | null;
  riskMetrics: RiskMetricsResponse | null;
  loading: Record<string, boolean>;
  error: string | null;
}

const initialState: AnalyticsState = {
  performance: null,
  sectorAllocation: null,
  assetAllocation: null,
  attribution: null,
  benchmarkComparison: null,
  riskMetrics: null,
  loading: {},
  error: null,
};

export const fetchPerformance = createAsyncThunk(
  'analytics/performance',
  async ({ id, period }: { id: number; period?: string }) =>
    portfolioApi.getPerformance(id, period),
);

export const fetchSectorAllocation = createAsyncThunk(
  'analytics/sectorAllocation',
  async ({ id }: { id: number }) =>
    portfolioApi.getSectorAllocation(id),
);

export const fetchAssetAllocation = createAsyncThunk(
  'analytics/assetAllocation',
  async ({ id }: { id: number }) =>
    portfolioApi.getAssetAllocation(id),
);

export const fetchAttribution = createAsyncThunk(
  'analytics/attribution',
  async ({ id, period }: { id: number; period?: string }) =>
    portfolioApi.getAttribution(id, period),
);

export const fetchBenchmarkComparison = createAsyncThunk(
  'analytics/benchmarkComparison',
  async ({ id, period }: { id: number; period?: string }) =>
    portfolioApi.getBenchmarkComparison(id, period),
);

export const fetchRiskMetrics = createAsyncThunk(
  'analytics/riskMetrics',
  async ({ id, period }: { id: number; period?: string }) =>
    portfolioApi.getRiskMetrics(id, period),
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const addLoading = (key: string) => ({
      pending: (state: AnalyticsState) => {
        state.loading[key] = true;
        state.error = null;
      },
      rejected: (state: AnalyticsState, action: { error: { message?: string } }) => {
        state.loading[key] = false;
        state.error = action.error.message || `Failed to load ${key}`;
      },
    });

    const perf = addLoading('performance');
    builder
      .addCase(fetchPerformance.pending, perf.pending)
      .addCase(fetchPerformance.fulfilled, (state, action) => {
        state.loading.performance = false;
        state.performance = action.payload;
      })
      .addCase(fetchPerformance.rejected, perf.rejected);

    const sector = addLoading('sectorAllocation');
    builder
      .addCase(fetchSectorAllocation.pending, sector.pending)
      .addCase(fetchSectorAllocation.fulfilled, (state, action) => {
        state.loading.sectorAllocation = false;
        state.sectorAllocation = action.payload;
      })
      .addCase(fetchSectorAllocation.rejected, sector.rejected);

    const asset = addLoading('assetAllocation');
    builder
      .addCase(fetchAssetAllocation.pending, asset.pending)
      .addCase(fetchAssetAllocation.fulfilled, (state, action) => {
        state.loading.assetAllocation = false;
        state.assetAllocation = action.payload;
      })
      .addCase(fetchAssetAllocation.rejected, asset.rejected);

    const attr = addLoading('attribution');
    builder
      .addCase(fetchAttribution.pending, attr.pending)
      .addCase(fetchAttribution.fulfilled, (state, action) => {
        state.loading.attribution = false;
        state.attribution = action.payload;
      })
      .addCase(fetchAttribution.rejected, attr.rejected);

    const bench = addLoading('benchmarkComparison');
    builder
      .addCase(fetchBenchmarkComparison.pending, bench.pending)
      .addCase(fetchBenchmarkComparison.fulfilled, (state, action) => {
        state.loading.benchmarkComparison = false;
        state.benchmarkComparison = action.payload;
      })
      .addCase(fetchBenchmarkComparison.rejected, bench.rejected);

    const risk = addLoading('riskMetrics');
    builder
      .addCase(fetchRiskMetrics.pending, risk.pending)
      .addCase(fetchRiskMetrics.fulfilled, (state, action) => {
        state.loading.riskMetrics = false;
        state.riskMetrics = action.payload;
      })
      .addCase(fetchRiskMetrics.rejected, risk.rejected);
  },
});

export default analyticsSlice.reducer;
