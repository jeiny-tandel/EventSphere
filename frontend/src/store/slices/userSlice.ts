import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  assignUserRole,
  deactivateUser as apiDeactivateUser,
  getUserById,
  getUsers,
  updateUser,
  updateUserStatus,
} from '../../api/users.api.ts';
import type {
  AssignUserRolePayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  User,
} from '../../types/user.types.ts';
import { extractErrorMessage } from '../../utils';
import { authSlice } from './authSlice.ts';

const { logout } = authSlice.actions;

export interface UserState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  isLoaded: boolean;
  isSubmitting: boolean;
  error: string | null;
  currentRequestId: string | null;
  currentEntityRequestId: string | null;
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  isLoaded: false,
  isSubmitting: false,
  error: null,
  currentRequestId: null,
  currentEntityRequestId: null,
};

export const fetchUsers = createAsyncThunk<
  User[],
  void,
  { rejectValue: string }
>('users/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    return await getUsers();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch users.'),
    );
  }
});

export const fetchUserById = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>('users/fetchUserById', async (id, { rejectWithValue }) => {
  try {
    return await getUserById(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, `Failed to fetch user with ID '${id}'.`),
    );
  }
});

export const updateExistingUser = createAsyncThunk<
  User,
  { id: string; data: UpdateUserPayload },
  { rejectValue: string }
>('users/updateExistingUser', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await updateUser(id, data);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to update user.'),
    );
  }
});

export const deactivateUser = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>('users/deactivateUser', async (id, { rejectWithValue }) => {
  try {
    return await apiDeactivateUser(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to deactivate user.'),
    );
  }
});

export const assignRoleToUser = createAsyncThunk<
  User,
  { id: string; data: AssignUserRolePayload },
  { rejectValue: string }
>('users/assignRoleToUser', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await assignUserRole(id, data);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to assign role to user.'),
    );
  }
});

export const updateExistingUserStatus = createAsyncThunk<
  User,
  { id: string; data: UpdateUserStatusPayload },
  { rejectValue: string }
>(
  'users/updateExistingUserStatus',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateUserStatus(id, data);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, 'Failed to update user status.'),
      );
    }
  },
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchUsers
    builder
      .addCase(fetchUsers.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        if (state.currentRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.isLoaded = true;
          state.users = action.payload;
          state.currentRequestId = null;
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        if (state.currentRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.error = action.payload ?? 'Failed to fetch users.';
          state.currentRequestId = null;
        }
      });

    // fetchUserById
    builder
      .addCase(fetchUserById.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.currentEntityRequestId = action.meta.requestId;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        if (state.currentEntityRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.selectedUser = action.payload;
          const userIndex = state.users.findIndex(
            (user) => user.id === action.payload.id,
          );
          if (userIndex !== -1) {
            state.users[userIndex] = action.payload;
          } else {
            state.users.push(action.payload);
          }
          state.currentEntityRequestId = null;
        }
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        if (state.currentEntityRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.error = action.payload ?? 'Failed to fetch user.';
          state.currentEntityRequestId = null;
        }
      });

    // updateExistingUser
    builder
      .addCase(updateExistingUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        updateExistingUser.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.isSubmitting = false;
          state.users = state.users.map((user) =>
            user.id === action.payload.id ? action.payload : user,
          );
          if (state.selectedUser?.id === action.payload.id) {
            state.selectedUser = action.payload;
          }
        },
      )
      .addCase(updateExistingUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to update user.';
      });

    // deactivateUser
    builder
      .addCase(deactivateUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        deactivateUser.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.isSubmitting = false;
          state.users = state.users.map((user) =>
            user.id === action.payload.id ? action.payload : user,
          );
          if (state.selectedUser?.id === action.payload.id) {
            state.selectedUser = action.payload;
          }
        },
      )
      .addCase(deactivateUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to deactivate user.';
      });

    // assignRoleToUser
    builder
      .addCase(assignRoleToUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        assignRoleToUser.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.isSubmitting = false;
          state.users = state.users.map((user) =>
            user.id === action.payload.id ? action.payload : user,
          );
          if (state.selectedUser?.id === action.payload.id) {
            state.selectedUser = action.payload;
          }
        },
      )
      .addCase(assignRoleToUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to assign role to user.';
      });

    // updateExistingUserStatus
    builder
      .addCase(updateExistingUserStatus.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        updateExistingUserStatus.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.isSubmitting = false;
          state.users = state.users.map((user) =>
            user.id === action.payload.id ? action.payload : user,
          );
          if (state.selectedUser?.id === action.payload.id) {
            state.selectedUser = action.payload;
          }
        },
      )
      .addCase(updateExistingUserStatus.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to update user status.';
      });

    // reset state on logout
    builder.addCase(logout, () => initialState);
  },
});

export const { setSelectedUser, clearUserError } = userSlice.actions;
export const userReducer = userSlice.reducer;
export default userReducer;
