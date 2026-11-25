import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  cancelRegistration,
  getMyRegistrations,
  registerForEvent,
} from '../../api/registrations.api.ts';
import type { EventRegistration } from '../../types/registration.types.ts';
import { extractErrorMessage } from '../../utils/error.utils.ts';
import { authSlice } from './authSlice.ts';

const { logout } = authSlice.actions;

export interface RegistrationState {
  registrations: EventRegistration[];
  loading: boolean;
  error: string | null;
}

const initialState: RegistrationState = {
  registrations: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchMyRegistrations = createAsyncThunk<
  EventRegistration[],
  void,
  { rejectValue: string }
>('registrations/fetchMyRegistrations', async (_, { rejectWithValue }) => {
  try {
    return await getMyRegistrations();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch registrations.'),
    );
  }
});

export const registerForEventThunk = createAsyncThunk<
  EventRegistration,
  string,
  { rejectValue: string }
>('registrations/registerForEvent', async (eventId, { rejectWithValue }) => {
  try {
    return await registerForEvent(eventId);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to register for event.'),
    );
  }
});

export const cancelRegistrationThunk = createAsyncThunk<
  EventRegistration,
  string,
  { rejectValue: string }
>('registrations/cancelRegistration', async (id, { rejectWithValue }) => {
  try {
    return await cancelRegistration(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to cancel registration.'),
    );
  }
});

// Registration Slice
export const registrationSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    clearRegistrationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchMyRegistrations
    builder
      .addCase(fetchMyRegistrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMyRegistrations.fulfilled,
        (state, action: PayloadAction<EventRegistration[]>) => {
          state.loading = false;
          state.registrations = action.payload;
        },
      )
      .addCase(fetchMyRegistrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch registrations.';
      });

    // registerForEventThunk
    builder
      .addCase(registerForEventThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        registerForEventThunk.fulfilled,
        (state, action: PayloadAction<EventRegistration>) => {
          state.loading = false;
          state.registrations.unshift(action.payload);
        },
      )
      .addCase(registerForEventThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to register for event.';
      });

    // cancelRegistrationThunk
    builder
      .addCase(cancelRegistrationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        cancelRegistrationThunk.fulfilled,
        (state, action: PayloadAction<EventRegistration>) => {
          state.loading = false;
          state.registrations = state.registrations.map((registration) =>
            registration.id === action.payload.id
              ? action.payload
              : registration,
          );
        },
      )
      .addCase(cancelRegistrationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to cancel registration.';
      });

    // reset state on logout
    builder.addCase(logout, () => initialState);
  },
});

export const { clearRegistrationError } = registrationSlice.actions;
export const registrationReducer = registrationSlice.reducer;
export default registrationReducer;
