import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../api/auth';

export type User = {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'seller';
  avatar: string | null;
};

type AuthState = {
  user: User | null;
  loading: boolean;
};

const initialState: AuthState = { user: null, loading: true };

export const fetchMe = createAsyncThunk('auth/me', async () => authApi.me());
export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  }
});

export default slice.reducer;
