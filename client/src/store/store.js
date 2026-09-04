import { configureStore } from '@reduxjs/toolkit';
import authReducer           from './authSlice';
import projectReducer        from './projectSlice';
import projectRequestReducer from './projectRequestSlice';
import messageReducer        from './messageSlice';
import notificationReducer   from './notificationSlice';
import billingReducer        from './billingSlice';

export const store = configureStore({
  reducer: {
    auth:           authReducer,
    projects:       projectReducer,
    projectRequests: projectRequestReducer,
    messages:       messageReducer,
    notifications:  notificationReducer,
    billing:        billingReducer,
  },
});
