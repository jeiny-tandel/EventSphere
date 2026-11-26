import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  cancelRegistration,
  getManagementRegistrations,
  getMyRegistrations,
  registerForEvent,
  updateRegistrationStatus,
} from '../../api/registrations.api.ts';
import type {
  EventRegistration,
  ManagementEventRegistration,
  RegistrationStatus,
} from '../../types/registration.types.ts';
import { extractErrorMessage } from '../../utils';
import { authSlice } from './authSlice.ts';

const { logout } = authSlice.actions;

export interface RegistrationState {
  registrations: EventRegistration[];
  managementRegistrations: ManagementEventRegistration[];
  loading: boolean;
  managementLoading: boolean;
  isManagementLoaded: boolean;
  isUpdatingStatus: boolean;
  error: string | null;
}

const initialState: RegistrationState = {
  registrations: [],
  managementRegistrations: [],
  loading: false,
  managementLoading: false,
  isManagementLoaded: false,
  isUpdatingStatus: false,
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

export type RegisterForEventInput =
  | string
  | { eventId: string; quantity?: number };

export const registerForEventThunk = createAsyncThunk<
  EventRegistration,
  RegisterForEventInput,
  { rejectValue: string }
>('registrations/registerForEvent', async (input, { rejectWithValue }) => {
  const eventId = typeof input === 'string' ? input : input.eventId;
  const quantity = typeof input === 'string' ? 1 : (input.quantity ?? 1);

  try {
    return await registerForEvent(eventId, quantity);
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

export const fetchManagementRegistrations = createAsyncThunk<
  ManagementEventRegistration[],
  void,
  { rejectValue: string }
>('registrations/fetchManagementRegistrations', async (_, { rejectWithValue }) => {
  try {
    return await getManagementRegistrations();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch management registrations.'),
    );
  }
});

export const updateRegistrationStatusThunk = createAsyncThunk<
  ManagementEventRegistration,
  { id: string; status: RegistrationStatus },
  { rejectValue: string }
>(
  'registrations/updateRegistrationStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await updateRegistrationStatus(id, status);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, 'Failed to update registration status.'),
      );
    }
  },
);

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

    // fetchManagementRegistrations
    builder
      .addCase(fetchManagementRegistrations.pending, (state) => {
        state.managementLoading = true;
        state.error = null;
      })
      .addCase(
        fetchManagementRegistrations.fulfilled,
        (state, action: PayloadAction<ManagementEventRegistration[]>) => {
          state.managementLoading = false;
          state.isManagementLoaded = true;
          state.managementRegistrations = action.payload;
        },
      )
      .addCase(fetchManagementRegistrations.rejected, (state, action) => {
        state.managementLoading = false;
        state.error =
          action.payload ?? 'Failed to fetch management registrations.';
      });

    // updateRegistrationStatusThunk
    builder
      .addCase(updateRegistrationStatusThunk.pending, (state) => {
        state.isUpdatingStatus = true;
        state.error = null;
      })
      .addCase(
        updateRegistrationStatusThunk.fulfilled,
        (state, action: PayloadAction<ManagementEventRegistration>) => {
          state.isUpdatingStatus = false;
          state.managementRegistrations = state.managementRegistrations.map(
            (registration) =>
              registration.id === action.payload.id
                ? action.payload
                : registration,
          );
        },
      )
      .addCase(updateRegistrationStatusThunk.rejected, (state, action) => {
        state.isUpdatingStatus = false;
        state.error =
          action.payload ?? 'Failed to update registration status.';
      });

    // reset state on logout
    builder.addCase(logout, () => initialState);
  },
});

export const { clearRegistrationError } = registrationSlice.actions;
export const registrationReducer = registrationSlice.reducer;
export default registrationReducer;
