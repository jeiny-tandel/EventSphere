import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from './slices/authSlice.ts';
import { permissionReducer } from './slices/permissionSlice.ts';
import { roleReducer } from './slices/roleSlice.ts';
import { userReducer } from './slices/userSlice.ts';

export const rootReducer = combineReducers({
  auth: authReducer,
  roles: roleReducer,
  permissions: permissionReducer,
  user: userReducer,
});

