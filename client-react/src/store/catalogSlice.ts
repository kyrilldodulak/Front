import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { fetchProducts, type Product, type ListResponse } from '../api/products';

export type CatalogFilters = {
  search: string;
  genre: string;
  platform: string;
  ordering: string;
};

type CatalogState = {
  items: Product[];
  page: number;
  pageSize: number;
  count: number;
  hasNext: boolean;
  loading: boolean;
  error: string | null;
  filters: CatalogFilters;
};

const initialState: CatalogState = {
  items: [],
  page: 1,
  pageSize: 12,
  count: 0,
  hasNext: false,
  loading: false,
  error: null,
  filters: {
    search: '',
    genre: '',
    platform: '',
    ordering: '-rating'
  }
};

export const fetchCatalog = createAsyncThunk<
  ListResponse,
  void,
  { state: { catalog: CatalogState } }
>('catalog/fetch', async (_arg, thunkApi) => {
  const state = thunkApi.getState().catalog;
  return fetchProducts({
    page: state.page,
    pageSize: state.pageSize,
    search: state.filters.search,
    genre: state.filters.genre,
    platform: state.filters.platform,
    ordering: state.filters.ordering
  });
});

const slice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<Partial<CatalogFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload);
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.page = 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.loading = false;
        if (state.page === 1) {
          state.items = action.payload.results;
        } else {
          const existing = new Set(state.items.map((p) => p.id));
          const fresh = action.payload.results.filter((p) => !existing.has(p.id));
          state.items = [...state.items, ...fresh];
        }
        state.count = action.payload.count;
        state.hasNext = action.payload.hasNext;
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Помилка завантаження';
      });
  }
});

export const { setFilter, setPage, setPageSize } = slice.actions;
export default slice.reducer;
