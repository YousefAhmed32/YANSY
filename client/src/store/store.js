import { configureStore } from '@reduxjs/toolkit';
import authReducer         from './authSlice';
import projectReducer      from './projectSlice';
import messageReducer      from './messageSlice';
import notificationReducer from './notificationSlice';
import billingReducer      from './billingSlice';

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    projects:      projectReducer,
    messages:      messageReducer,
    notifications: notificationReducer,
    billing:       billingReducer,
  },
});
