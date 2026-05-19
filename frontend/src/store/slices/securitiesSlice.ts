import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { portfolioApi } from '../../api/portfolioApi';
import type { SecurityRead } from '../../types';

interface SecuritiesState {
  list: SecurityRead[];
  loading: boolean;
  error: string | null;
}

const initialState: SecuritiesState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchSecurities = createAsyncThunk(
  'securities/fetchAll',
  async () => portfolioApi.listSecurities(),
);

const securitiesSlice = createSlice({
  name: 'securities',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSecurities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecurities.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSecurities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load securities';
      });
  },
});

export default securitiesSlice.reducer;
