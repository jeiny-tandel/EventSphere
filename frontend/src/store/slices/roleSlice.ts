import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  assignRolePermissions,
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  removeRolePermissions,
  updateRole,
} from "../../api/roles.api.ts";
import type {
  AssignPermissionsPayload,
  CreateRolePayload,
  Permission,
  RemovePermissionsPayload,
  Role,
  RoleResponse,
  UpdateRolePayload,
} from "../../types/rbac.types.ts";
import { extractErrorMessage } from "../../utils/error.utils.ts";
import { authSlice } from "./authSlice.ts";
import { updateExistingPermission } from "./permissionSlice.ts";

const { logout } = authSlice.actions;

export interface RoleState {
  roles: Role[];
  selectedRole: Role | null;
  isLoading: boolean;
  isLoaded: boolean;
  currentRequestId: string | null;
  currentEntityRequestId: string | null;
  error: string | null;
}

const initialState: RoleState = {
  roles: [],
  selectedRole: null,
  isLoading: false,
  isLoaded: false,
  currentRequestId: null,
  currentEntityRequestId: null,
  error: null,
};

export const fetchRoles = createAsyncThunk<
  Role[],
  void,
  { rejectValue: string }
>("roles/fetchRoles", async (_, { rejectWithValue }) => {
  try {
    return await getRoles();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, "Failed to fetch roles."),
    );
  }
});

export const fetchRoleById = createAsyncThunk<
  Role,
  string,
  { rejectValue: string }
>("roles/fetchRoleById", async (id, { rejectWithValue }) => {
  try {
    return await getRoleById(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, `Failed to fetch role with ID '${id}'.`),
    );
  }
});

export const createNewRole = createAsyncThunk<
  RoleResponse,
  CreateRolePayload,
  { rejectValue: string }
>("roles/createNewRole", async (data, { rejectWithValue }) => {
  try {
    return await createRole(data);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, "Failed to create role."),
    );
  }
});

export const updateExistingRole = createAsyncThunk<
  RoleResponse,
  { id: string; data: UpdateRolePayload },
  { rejectValue: string }
>("roles/updateExistingRole", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await updateRole(id, data);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, "Failed to update role."),
    );
  }
});

export const removeRole = createAsyncThunk<
  RoleResponse,
  string,
  { rejectValue: string }
>("roles/removeRole", async (id, { rejectWithValue }) => {
  try {
    return await deleteRole(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, "Failed to delete role."),
    );
  }
});

export const assignPermissionsToRole = createAsyncThunk<
  Role,
  { id: string; payload: AssignPermissionsPayload },
  { rejectValue: string }
>(
  "roles/assignPermissionsToRole",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await assignRolePermissions(id, payload);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Failed to assign permissions to role."),
      );
    }
  },
);

export const removePermissionsFromRole = createAsyncThunk<
  Role,
  { id: string; payload: RemovePermissionsPayload },
  { rejectValue: string }
>(
  "roles/removePermissionsFromRole",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await removeRolePermissions(id, payload);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Failed to remove permissions from role."),
      );
    }
  },
);

export const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    setSelectedRole: (state, action: PayloadAction<Role | null>) => {
      state.selectedRole = action.payload;
    },
    clearRoleError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchRoles
    builder
      .addCase(fetchRoles.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        if (state.currentRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.isLoaded = true;
          state.roles = action.payload;
          state.currentRequestId = null;
        }
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        if (state.currentRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.error = action.payload ?? "Failed to fetch roles.";
          state.currentRequestId = null;
        }
      });

    // fetchRoleById
    builder
      .addCase(fetchRoleById.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.currentEntityRequestId = action.meta.requestId;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        if (state.currentEntityRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.selectedRole = action.payload;
          const roleIndex = state.roles.findIndex(
            (role) => role.id === action.payload.id,
          );
          if (roleIndex !== -1) {
            state.roles[roleIndex] = action.payload;
          } else {
            state.roles.push(action.payload);
          }
          state.currentEntityRequestId = null;
        }
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        if (state.currentEntityRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.error = action.payload ?? "Failed to fetch role.";
          state.currentEntityRequestId = null;
        }
      });

    // createNewRole
    builder
      .addCase(createNewRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createNewRole.fulfilled,
        (state, action: PayloadAction<RoleResponse>) => {
          state.isLoading = false;
          const newRole: Role = {
            ...action.payload,
            permissions: [],
          };
          state.roles.push(newRole);
        },
      )
      .addCase(createNewRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create role.";
      });

    // updateExistingRole
    builder
      .addCase(updateExistingRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateExistingRole.fulfilled,
        (state, action: PayloadAction<RoleResponse>) => {
          state.isLoading = false;
          state.roles = state.roles.map((role) =>
            role.id === action.payload.id
              ? { ...role, ...action.payload }
              : role,
          );
          if (state.selectedRole?.id === action.payload.id) {
            state.selectedRole = {
              ...state.selectedRole,
              ...action.payload,
            };
          }
        },
      )
      .addCase(updateExistingRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update role.";
      });

    // removeRole
    builder
      .addCase(removeRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeRole.fulfilled,
        (state, action: PayloadAction<RoleResponse>) => {
          state.isLoading = false;
          state.roles = state.roles.filter(
            (role) => role.id !== action.payload.id,
          );
          if (state.selectedRole?.id === action.payload.id) {
            state.selectedRole = null;
          }
        },
      )
      .addCase(removeRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete role.";
      });

    // assignPermissionsToRole
    builder
      .addCase(assignPermissionsToRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        assignPermissionsToRole.fulfilled,
        (state, action: PayloadAction<Role>) => {
          state.isLoading = false;
          state.roles = state.roles.map((role) =>
            role.id === action.payload.id ? action.payload : role,
          );
          if (state.selectedRole?.id === action.payload.id) {
            state.selectedRole = action.payload;
          }
        },
      )
      .addCase(assignPermissionsToRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to assign permissions to role.";
      });

    // removePermissionsFromRole
    builder
      .addCase(removePermissionsFromRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removePermissionsFromRole.fulfilled,
        (state, action: PayloadAction<Role>) => {
          state.isLoading = false;
          state.roles = state.roles.map((role) =>
            role.id === action.payload.id ? action.payload : role,
          );
          if (state.selectedRole?.id === action.payload.id) {
            state.selectedRole = action.payload;
          }
        },
      )
      .addCase(removePermissionsFromRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload ?? "Failed to remove permissions from role.";
      });

    // synchronize nested permissions when a permission is updated
    builder.addCase(
      updateExistingPermission.fulfilled,
      (state, action: PayloadAction<Permission>) => {
        const updatedPermission = action.payload;
        state.roles = state.roles.map((role) => ({
          ...role,
          permissions: role.permissions.map((rp) =>
            rp.permissionId === updatedPermission.id
              ? { ...rp, permission: updatedPermission }
              : rp,
          ),
        }));
        if (state.selectedRole) {
          state.selectedRole = {
            ...state.selectedRole,
            permissions: state.selectedRole.permissions.map((rp) =>
              rp.permissionId === updatedPermission.id
                ? { ...rp, permission: updatedPermission }
                : rp,
            ),
          };
        }
      },
    );

    // reset state on logout
    builder.addCase(logout, () => initialState);
  },
});

export const { setSelectedRole, clearRoleError } = roleSlice.actions;
export const roleReducer = roleSlice.reducer;
export default roleReducer;
