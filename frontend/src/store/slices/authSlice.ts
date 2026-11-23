import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';
import { getProfile, loginUser } from '../../api';
import type { AuthResponse, LoginCredentials, UserProfile } from '../../types';
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from '../../utils/token.utils.ts';
import { extractErrorMessage } from '../../utils/error.utils.ts';

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthThunkError {
  message: string;
  status?: number;
}

const initialState: AuthState = {
  user: null,
  accessToken: getAccessToken(),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};


export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await loginUser(credentials);
    setAccessToken(response.accessToken);
    return response;
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(
        error,
        'Login failed. Please check your credentials.',
      ),
    );
  }
});

export const fetchProfile = createAsyncThunk<
  UserProfile,
  void,
  { state: { auth: AuthState }; rejectValue: AuthThunkError }
>('auth/fetchProfile', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = state.auth?.accessToken;

    if (!token) {
      return rejectWithValue({
        message: 'No access token found',
        status: 401,
      });
    }

    const profile = await getProfile();
    return profile;
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        removeAccessToken();
        return rejectWithValue({
          message: extractErrorMessage(
            error,
            'Session expired or invalid. Please log in again.',
          ),
          status: 401,
        });
      }

      return rejectWithValue({
        message: extractErrorMessage(
          error,
          'Failed to retrieve user profile.',
        ),
        status,
      });
    }

    return rejectWithValue({
      message: extractErrorMessage(error, 'An unexpected error occurred.'),
    });
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    setAuthInitialized: (state) => {
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    // login thunk
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<AuthResponse>) => {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.error = null;
        },
      )
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload ?? 'Login failed. Please check your credentials.';
      });

    // fetchProfile thunk
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchProfile.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.isInitialized = true;
          state.error = null;
        },
      )
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error =
          action.payload?.message ??
          action.error.message ??
          'Failed to fetch user profile.';
        if (action.payload?.status === 401) {
          state.isAuthenticated = false;
          state.user = null;
          state.accessToken = null;
        }
      });
  },
});

const { logout } = authSlice.actions;
export const { setAuthInitialized } = authSlice.actions;

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    dispatch(logout());
    removeAccessToken();
  },
);

export const authReducer = authSlice.reducer;
export default authReducer;
