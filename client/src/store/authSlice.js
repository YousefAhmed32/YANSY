import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// ─── Helper: extract the best error message from an Axios error ──────────────
const extractError = (error, fallback) => {
  // Server returned a JSON { error: "..." } body
  if (error?.response?.data?.error) return error.response.data.error;
  // Timeout
  if (error?.code === 'ECONNABORTED' || error?.friendlyMessage)
    return (
      error.friendlyMessage ||
      'The request timed out. Please check your connection and try again.'
    );
  // Network down
  if (!error?.response)
    return 'Cannot reach the server. Please check your connection.';
  return fallback;
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, fullName, phoneNumber, brandName, companyName }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        fullName,
        phoneNumber,
        brandName,
        companyName,
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'Registration failed. Please try again.'));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      // Fetch subscription after login (setTimeout: setImmediate is Node.js-only)
      setTimeout(() => dispatch(getMe()), 0);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'Login failed. Please try again.'));
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.get('/auth/me');
      // Hydrate billing slice with subscription from /me response
      if (response.data.subscription !== undefined) {
        const { setSubscription } = await import('./billingSlice');
        dispatch(setSubscription(response.data.subscription));
      }
      return response.data.user;
    } catch (error) {
      return rejectWithValue(extractError(error, 'Failed to get user information.'));
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async ({ code }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/auth/google', { code });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      // Fetch full profile + subscription after OAuth login (setTimeout: setImmediate is Node.js-only)
      setTimeout(() => dispatch(getMe()), 0);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'Google sign-in failed. Please try again.'));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore network errors — still clear local state
  }
  localStorage.removeItem('token');
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            null,
    token:           localStorage.getItem('token'),
    isAuthenticated: false,
    loading:         false,
    error:           null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // ── Register ──────────────────────────────────────────────────────────
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading         = false;
        state.user            = action.payload.user;
        state.token           = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload;
        state.isAuthenticated = false;
      })

      // ── Login ─────────────────────────────────────────────────────────────
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading         = false;
        state.user            = action.payload.user;
        state.token           = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload;
        state.isAuthenticated = false;
      })

      // ── Get Me ────────────────────────────────────────────────────────────
      .addCase(getMe.pending, (state) => { state.loading = true; })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading         = false;
        state.user            = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.loading         = false;
        state.user            = null;
        state.isAuthenticated = false;
        state.token           = null;
        localStorage.removeItem('token');
      })

      // ── Google Login ──────────────────────────────────────────────────────
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading         = false;
        state.user            = action.payload.user;
        state.token           = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload;
        state.isAuthenticated = false;
      })

      // ── Logout ────────────────────────────────────────────────────────────
      .addCase(logout.fulfilled, (state) => {
        state.user            = null;
        state.token           = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
