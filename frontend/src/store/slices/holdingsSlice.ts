import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { portfolioApi } from '../../api/portfolioApi';
import type { HoldingsResponse } from '../../types';

interface HoldingsState {
  data: HoldingsResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: HoldingsState = {
  data: null,
  loading: false,
  error: null,
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

const holdingsSlice = createSlice({
  name: 'holdings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export default holdingsSlice.reducer;
