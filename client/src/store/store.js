import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import projectReducer from './projectSlice';
import messageReducer from './messageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    messages: messageReducer,
  },
});

// TypeScript types (commented for JS project, uncomment if using TypeScript)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

