import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  createPermission,
  createPermissionCategory as apiCreatePermissionCategory,
  deletePermission,
  deletePermissionCategory as apiDeletePermissionCategory,
  getPermissionById,
  getPermissionCategories as apiGetPermissionCategories,
  getPermissions,
  updatePermission,
  updatePermissionCategory as apiUpdatePermissionCategory,
} from '../../api/permissions.api.ts';
import type {
  CreatePermissionCategoryPayload,
  CreatePermissionPayload,
  Permission,
  PermissionCategory,
  UpdatePermissionCategoryPayload,
  UpdatePermissionPayload,
} from '../../types/rbac.types.ts';
import { extractErrorMessage } from '../../utils';
import { authSlice } from './authSlice.ts';

const { logout } = authSlice.actions;

export interface PermissionState {
  permissions: Permission[];
  selectedPermission: Permission | null;
  categories: PermissionCategory[];
  isLoading: boolean;
  isLoaded: boolean;
  categoriesLoading: boolean;
  currentRequestId: string | null;
  currentEntityRequestId: string | null;
  error: string | null;
  categoriesError: string | null;
}

const initialState: PermissionState = {
  permissions: [],
  selectedPermission: null,
  categories: [],
  isLoading: false,
  isLoaded: false,
  categoriesLoading: false,
  currentRequestId: null,
  currentEntityRequestId: null,
  error: null,
  categoriesError: null,
};

// Async Thunks - Permissions
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

// Async Thunks - Permission Categories
export const fetchPermissionCategories = createAsyncThunk<
  PermissionCategory[],
  void,
  { rejectValue: string }
>('permissions/fetchPermissionCategories', async (_, { rejectWithValue }) => {
  try {
    return await apiGetPermissionCategories();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch permission categories.'),
    );
  }
});

export const createPermissionCategory = createAsyncThunk<
  PermissionCategory,
  CreatePermissionCategoryPayload,
  { rejectValue: string }
>('permissions/createPermissionCategory', async (payload, { rejectWithValue }) => {
  try {
    return await apiCreatePermissionCategory(payload);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to create permission category.'),
    );
  }
});

export const updatePermissionCategory = createAsyncThunk<
  PermissionCategory,
  { id: string; data: UpdatePermissionCategoryPayload },
  { rejectValue: string }
>(
  'permissions/updatePermissionCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiUpdatePermissionCategory(id, data);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, 'Failed to update permission category.'),
      );
    }
  },
);

export const deletePermissionCategory = createAsyncThunk<
  PermissionCategory,
  string,
  { rejectValue: string }
>('permissions/deletePermissionCategory', async (id, { rejectWithValue }) => {
  try {
    return await apiDeletePermissionCategory(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to delete permission category.'),
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
    clearCategoriesError: (state) => {
      state.categoriesError = null;
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

    // fetchPermissionCategories
    builder
      .addCase(fetchPermissionCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(
        fetchPermissionCategories.fulfilled,
        (state, action: PayloadAction<PermissionCategory[]>) => {
          state.categoriesLoading = false;
          state.categories = action.payload;
        },
      )
      .addCase(fetchPermissionCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError =
          action.payload ?? 'Failed to fetch permission categories.';
      });

    // createPermissionCategory
    builder
      .addCase(createPermissionCategory.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(
        createPermissionCategory.fulfilled,
        (state, action: PayloadAction<PermissionCategory>) => {
          state.categoriesLoading = false;
          state.categories.push(action.payload);
        },
      )
      .addCase(createPermissionCategory.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError =
          action.payload ?? 'Failed to create permission category.';
      });

    // updatePermissionCategory
    builder
      .addCase(updatePermissionCategory.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(
        updatePermissionCategory.fulfilled,
        (state, action: PayloadAction<PermissionCategory>) => {
          state.categoriesLoading = false;
          state.categories = state.categories.map((cat) =>
            cat.id === action.payload.id ? action.payload : cat,
          );
          state.permissions = state.permissions.map((p) =>
            p.categoryId === action.payload.id
              ? { ...p, category: action.payload }
              : p,
          );
          if (state.selectedPermission?.categoryId === action.payload.id) {
            state.selectedPermission = {
              ...state.selectedPermission,
              category: action.payload,
            };
          }
        },
      )
      .addCase(updatePermissionCategory.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError =
          action.payload ?? 'Failed to update permission category.';
      });

    // deletePermissionCategory
    builder
      .addCase(deletePermissionCategory.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(
        deletePermissionCategory.fulfilled,
        (state, action: PayloadAction<PermissionCategory, string, { arg: string }>) => {
          state.categoriesLoading = false;
          const deletedId = action.payload?.id || action.meta.arg;
          state.categories = state.categories.filter((cat) => cat.id !== deletedId);
        },
      )
      .addCase(deletePermissionCategory.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError =
          action.payload ?? 'Failed to delete permission category.';
      });

    // reset state on logout
    builder.addCase(logout, () => initialState);
  },
});

export const {
  setSelectedPermission,
  clearPermissionError,
  clearCategoriesError,
} = permissionSlice.actions;
export const permissionReducer = permissionSlice.reducer;
export default permissionReducer;
