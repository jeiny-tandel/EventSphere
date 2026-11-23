import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  createPermission,
  deletePermission,
  getPermissionById,
  getPermissions,
  updatePermission,
} from '../../api/permissions.api.ts';
import type {
  CreatePermissionPayload,
  Permission,
  UpdatePermissionPayload,
} from '../../types/rbac.types.ts';
import { extractErrorMessage } from '../../utils/error.utils.ts';
import { authSlice } from './authSlice.ts';

const { logout } = authSlice.actions;

export interface PermissionState {
  permissions: Permission[];
  selectedPermission: Permission | null;
  isLoading: boolean;
  isLoaded: boolean;
  currentRequestId: string | null;
  currentEntityRequestId: string | null;
  error: string | null;
}

const initialState: PermissionState = {
  permissions: [],
  selectedPermission: null,
  isLoading: false,
  isLoaded: false,
  currentRequestId: null,
  currentEntityRequestId: null,
  error: null,
};

export const fetchPermissions = createAsyncThunk<
  Permission[],
  void,
  { rejectValue: string }
>('permissions/fetchPermissions', async (_, { rejectWithValue }) => {
  try {
    return await getPermissions();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch permissions.'),
    );
  }
});

export const fetchPermissionById = createAsyncThunk<
  Permission,
  string,
  { rejectValue: string }
>('permissions/fetchPermissionById', async (id, { rejectWithValue }) => {
  try {
    return await getPermissionById(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, `Failed to fetch permission with ID '${id}'.`),
    );
  }
});

export const createNewPermission = createAsyncThunk<
  Permission,
  CreatePermissionPayload,
  { rejectValue: string }
>('permissions/createNewPermission', async (data, { rejectWithValue }) => {
  try {
    return await createPermission(data);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to create permission.'),
    );
  }
});

export const updateExistingPermission = createAsyncThunk<
  Permission,
  { id: string; data: UpdatePermissionPayload },
  { rejectValue: string }
>(
  'permissions/updateExistingPermission',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updatePermission(id, data);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, 'Failed to update permission.'),
      );
    }
  },
);

export const removePermission = createAsyncThunk<
  Permission,
  string,
  { rejectValue: string }
>('permissions/removePermission', async (id, { rejectWithValue }) => {
  try {
    return await deletePermission(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to delete permission.'),
    );
  }
});

export const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setSelectedPermission: (
      state,
      action: PayloadAction<Permission | null>,
    ) => {
      state.selectedPermission = action.payload;
    },
    clearPermissionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchPermissions
    builder
      .addCase(fetchPermissions.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        if (state.currentRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.isLoaded = true;
          state.permissions = action.payload;
          state.currentRequestId = null;
        }
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        if (state.currentRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.error = action.payload ?? 'Failed to fetch permissions.';
          state.currentRequestId = null;
        }
      });

    // fetchPermissionById
    builder
      .addCase(fetchPermissionById.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.currentEntityRequestId = action.meta.requestId;
      })
      .addCase(fetchPermissionById.fulfilled, (state, action) => {
        if (state.currentEntityRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.selectedPermission = action.payload;
          state.currentEntityRequestId = null;
        }
      })
      .addCase(fetchPermissionById.rejected, (state, action) => {
        if (state.currentEntityRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.error = action.payload ?? 'Failed to fetch permission.';
          state.currentEntityRequestId = null;
        }
      });

    // createNewPermission
    builder
      .addCase(createNewPermission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createNewPermission.fulfilled,
        (state, action: PayloadAction<Permission>) => {
          state.isLoading = false;
          state.permissions.push(action.payload);
        },
      )
      .addCase(createNewPermission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to create permission.';
      });

    // updateExistingPermission
    builder
      .addCase(updateExistingPermission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateExistingPermission.fulfilled,
        (state, action: PayloadAction<Permission>) => {
          state.isLoading = false;
          state.permissions = state.permissions.map((p) =>
            p.id === action.payload.id ? action.payload : p,
          );
          if (state.selectedPermission?.id === action.payload.id) {
            state.selectedPermission = action.payload;
          }
        },
      )
      .addCase(updateExistingPermission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update permission.';
      });

    // removePermission
    builder
      .addCase(removePermission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removePermission.fulfilled,
        (state, action: PayloadAction<Permission>) => {
          state.isLoading = false;
          state.permissions = state.permissions.filter(
            (p) => p.id !== action.payload.id,
          );
          if (state.selectedPermission?.id === action.payload.id) {
            state.selectedPermission = null;
          }
        },
      )
      .addCase(removePermission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete permission.';
      });

    // reset state on logout
    builder.addCase(logout, () => initialState);
  },
});

export const { setSelectedPermission, clearPermissionError } =
  permissionSlice.actions;
export const permissionReducer = permissionSlice.reducer;
export default permissionReducer;
