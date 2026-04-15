import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TimePeriod } from '../../types';

interface FilterState {
  selectedPortfolioId: number | null;
  period: TimePeriod;
  sectorFilter: string;
  assetClassFilter: string;
  searchQuery: string;
}

const initialState: FilterState = {
  selectedPortfolioId: null,
  period: 'YTD',
  sectorFilter: '',
  assetClassFilter: '',
  searchQuery: '',
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSelectedPortfolio(state, action: PayloadAction<number>) {
      state.selectedPortfolioId = action.payload;
    },
    setPeriod(state, action: PayloadAction<TimePeriod>) {
      state.period = action.payload;
    },
    setSectorFilter(state, action: PayloadAction<string>) {
      state.sectorFilter = action.payload;
    },
    setAssetClassFilter(state, action: PayloadAction<string>) {
      state.assetClassFilter = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  setSelectedPortfolio,
  setPeriod,
  setSectorFilter,
  setAssetClassFilter,
  setSearchQuery,
} = filterSlice.actions;

export default filterSlice.reducer;
