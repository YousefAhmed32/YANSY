import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// The customer-facing half of the existing project-request system
// (server/controllers/projectRequestController.js) — surfaces the
// authenticated user's own submitted requests so the dashboard can show a
// real status instead of nothing, and so a new request appears immediately
// without a full page reload.

export const fetchMyRequests = createAsyncThunk(
  'projectRequests/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/project-requests/my-requests');
      return res.data.requests || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load your requests');
    }
  }
);

const projectRequestSlice = createSlice({
  name: 'projectRequests',
  initialState: {
    requests: [],
    loading: false,
    loaded: false,
    error: null,
  },
  reducers: {
    addRequestLocal: (state, action) => {
      state.requests.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.requests = action.payload;
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload;
      });
  },
});

export const { addRequestLocal } = projectRequestSlice.actions;
export default projectRequestSlice.reducer;
