import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { portfolioApi } from '../../api/portfolioApi';
import type { HoldingsResponse, HoldingCreate, HoldingUpdate } from '../../types';

interface HoldingsState {
  data: HoldingsResponse | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  mutateError: string | null;
}

const initialState: HoldingsState = {
  data: null,
  loading: false,
  mutating: false,
  error: null,
  mutateError: null,
};

export const fetchHoldings = createAsyncThunk(
  'holdings/fetch',
  async (params: {
    id: number;
    as_of_date?: string;
    sector?: string;
    asset_class?: string;
    search?: string;
  }) => {
    const { id, ...rest } = params;
    return portfolioApi.getHoldings(id, rest);
  },
);

export const addHolding = createAsyncThunk(
  'holdings/add',
  async (
    { portfolioId, body }: { portfolioId: number; body: HoldingCreate },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const holding = await portfolioApi.addHolding(portfolioId, body);
      // Refresh holdings list so the new position appears
      dispatch(fetchHoldings({ id: portfolioId }));
      return holding;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add holding';
      return rejectWithValue(message);
    }
  },
);

export const updateHolding = createAsyncThunk(
  'holdings/update',
  async (
    {
      portfolioId,
      securityId,
      body,
    }: { portfolioId: number; securityId: number; body: HoldingUpdate },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const holding = await portfolioApi.updateHolding(portfolioId, securityId, body);
      dispatch(fetchHoldings({ id: portfolioId }));
      return holding;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update holding';
      return rejectWithValue(message);
    }
  },
);

export const deleteHolding = createAsyncThunk(
  'holdings/delete',
  async (
    { portfolioId, securityId }: { portfolioId: number; securityId: number },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await portfolioApi.deleteHolding(portfolioId, securityId);
      dispatch(fetchHoldings({ id: portfolioId }));
      return securityId;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete holding';
      return rejectWithValue(message);
    }
  },
);

const holdingsSlice = createSlice({
  name: 'holdings',
  initialState,
  reducers: {
    clearMutateError(state) {
      state.mutateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchHoldings
      .addCase(fetchHoldings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHoldings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHoldings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load holdings';
      })
      // addHolding
      .addCase(addHolding.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(addHolding.fulfilled, (state) => {
        state.mutating = false;
      })
      .addCase(addHolding.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = (action.payload as string) || 'Failed to add holding';
      })
      // updateHolding
      .addCase(updateHolding.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(updateHolding.fulfilled, (state) => {
        state.mutating = false;
      })
      .addCase(updateHolding.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = (action.payload as string) || 'Failed to update holding';
      })
      // deleteHolding
      .addCase(deleteHolding.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deleteHolding.fulfilled, (state) => {
        state.mutating = false;
      })
      .addCase(deleteHolding.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = (action.payload as string) || 'Failed to delete holding';
      });
  },
});

export const { clearMutateError: clearHoldingsMutateError } = holdingsSlice.actions;
export default holdingsSlice.reducer;
