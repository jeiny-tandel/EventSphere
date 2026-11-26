import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from './slices/authSlice.ts';
import { dashboardReducer } from './slices/dashboardSlice.ts';
import { eventReducer } from './slices/eventSlice.ts';
import { permissionReducer } from './slices/permissionSlice.ts';
import { registrationReducer } from './slices/registrationSlice.ts';
import { roleReducer } from './slices/roleSlice.ts';
import { userReducer } from './slices/userSlice.ts';

export const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  roles: roleReducer,
  permissions: permissionReducer,
  user: userReducer,
  events: eventReducer,
  registration: registrationReducer,
});

