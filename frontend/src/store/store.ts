import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import portfolioReducer from './slices/portfolioSlice';
import holdingsReducer from './slices/holdingsSlice';
import analyticsReducer from './slices/analyticsSlice';
import filterReducer from './slices/filterSlice';

export const store = configureStore({
  reducer: {
    portfolio: portfolioReducer,
    holdings: holdingsReducer,
    analytics: analyticsReducer,
    filters: filterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
