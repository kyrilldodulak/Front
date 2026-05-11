import { configureStore } from '@reduxjs/toolkit';
import catalogReducer from './catalogSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    catalog: catalogReducer,
    auth: authReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
