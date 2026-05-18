import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { portfolioApi } from '../../api/portfolioApi';
import type { Portfolio, PortfolioSummary, PortfolioCreate, PortfolioUpdate } from '../../types';

interface PortfolioState {
  list: Portfolio[];
  summary: PortfolioSummary | null;
  listLoading: boolean;
  summaryLoading: boolean;
  mutating: boolean;
  error: string | null;
  mutateError: string | null;
}

const initialState: PortfolioState = {
  list: [],
  summary: null,
  listLoading: false,
  summaryLoading: false,
  mutating: false,
  error: null,
  mutateError: null,
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

export const createPortfolio = createAsyncThunk(
  'portfolio/create',
  async (body: PortfolioCreate, { dispatch, rejectWithValue }) => {
    try {
      const portfolio = await portfolioApi.createPortfolio(body);
      // Refresh list so new portfolio appears in switcher
      dispatch(fetchPortfolios());
      return portfolio;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create portfolio';
      return rejectWithValue(message);
    }
  },
);

export const updatePortfolio = createAsyncThunk(
  'portfolio/update',
  async ({ id, body }: { id: number; body: PortfolioUpdate }, { dispatch, rejectWithValue }) => {
    try {
      const portfolio = await portfolioApi.updatePortfolio(id, body);
      dispatch(fetchPortfolios());
      return portfolio;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update portfolio';
      return rejectWithValue(message);
    }
  },
);

export const deletePortfolio = createAsyncThunk(
  'portfolio/delete',
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      await portfolioApi.deletePortfolio(id);
      dispatch(fetchPortfolios());
      return id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete portfolio';
      return rejectWithValue(message);
    }
  },
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearMutateError(state) {
      state.mutateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
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
      // fetchSummary
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
      })
      // createPortfolio
      .addCase(createPortfolio.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(createPortfolio.fulfilled, (state) => {
        state.mutating = false;
      })
      .addCase(createPortfolio.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = (action.payload as string) || 'Failed to create portfolio';
      })
      // updatePortfolio
      .addCase(updatePortfolio.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(updatePortfolio.fulfilled, (state) => {
        state.mutating = false;
      })
      .addCase(updatePortfolio.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = (action.payload as string) || 'Failed to update portfolio';
      })
      // deletePortfolio
      .addCase(deletePortfolio.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deletePortfolio.fulfilled, (state) => {
        state.mutating = false;
      })
      .addCase(deletePortfolio.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = (action.payload as string) || 'Failed to delete portfolio';
      });
  },
});

export const { clearMutateError } = portfolioSlice.actions;
export default portfolioSlice.reducer;
