import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { getDashboardOverview } from '../../api/dashboard.api.ts';
import type { DashboardOverview } from '../../types/dashboard.types.ts';
import { extractErrorMessage } from '../../utils';
import { authSlice } from './authSlice.ts';

const { logout } = authSlice.actions;

export interface DashboardState {
  overview: DashboardOverview | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  overview: null,
  isLoading: false,
  error: null,
};

export const fetchDashboardOverview = createAsyncThunk<
  DashboardOverview,
  void,
  { rejectValue: string }
>('dashboard/fetchDashboardOverview', async (_, { rejectWithValue }) => {
  try {
    return await getDashboardOverview();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch dashboard overview.'),
    );
  }
});

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchDashboardOverview.fulfilled,
        (state, action: PayloadAction<DashboardOverview>) => {
          state.isLoading = false;
          state.overview = action.payload;
        },
      )
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch dashboard overview.';
      });

    // Reset state on logout so user- and permission-scoped data is never retained
    builder.addCase(logout, () => initialState);
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export const dashboardReducer = dashboardSlice.reducer;
export default dashboardReducer;
