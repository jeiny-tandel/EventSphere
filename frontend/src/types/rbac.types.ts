export interface PermissionCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    permissions: number;
  };
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  category?: PermissionCategory;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermission[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export interface AssignPermissionsPayload {
  permissionIds: string[];
}

export interface RemovePermissionsPayload {
  permissionIds: string[];
}

export interface CreatePermissionPayload {
  name: string;
  description?: string;
  categoryId: string;
}

export interface UpdatePermissionPayload {
  name?: string;
  description?: string;
  categoryId?: string;
}

export interface CreatePermissionCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdatePermissionCategoryPayload {
  name?: string;
  description?: string;
}
