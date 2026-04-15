import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { portfolioApi } from '../../api/portfolioApi';
import type { Portfolio, PortfolioSummary } from '../../types';

interface PortfolioState {
  list: Portfolio[];
  summary: PortfolioSummary | null;
  listLoading: boolean;
  summaryLoading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  list: [],
  summary: null,
  listLoading: false,
  summaryLoading: false,
  error: null,
};

export const fetchPortfolios = createAsyncThunk(
  'portfolio/fetchAll',
  async () => portfolioApi.listPortfolios(),
);

export const fetchPortfolioSummary = createAsyncThunk(
  'portfolio/fetchSummary',
  async ({ id, period }: { id: number; period?: string }) =>
    portfolioApi.getSummary(id, period),
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolios.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchPortfolios.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.error.message || 'Failed to load portfolios';
      })
      .addCase(fetchPortfolioSummary.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchPortfolioSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.error.message || 'Failed to load summary';
      });
  },
});

export default portfolioSlice.reducer;
