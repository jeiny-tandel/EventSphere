import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from './slices/authSlice.ts';

export const rootReducer = combineReducers({
  auth: authReducer,
});
