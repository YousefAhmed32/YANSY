import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications');
      return res.data.notifications || [];
    } catch (err) {
      // gracefully degrade — notifications are non-critical
      return [];
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed');
    }
  }
);

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all');
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    // Push a real-time notification (from socket)
    pushNotification: (state, action) => {
      const notification = action.payload;
      // Avoid duplicates
      if (!state.items.find(n => n._id === notification._id)) {
        state.items.unshift(notification);
        if (!notification.read) state.unreadCount += 1;
      }
    },
    // Clear all notifications locally
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
    // Add local-only notification (no backend)
    addLocalNotification: (state, action) => {
      const n = {
        _id: `local_${Date.now()}`,
        type: action.payload.type || 'info',
        title: action.payload.title,
        message: action.payload.message,
        read: false,
        createdAt: new Date().toISOString(),
        local: true,
      };
      state.items.unshift(n);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const n = state.items.find(x => x._id === id);
        if (n && !n.read) {
          n.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach(n => { n.read = true; });
        state.unreadCount = 0;
      });
  },
});

export const { pushNotification, clearNotifications, addLocalNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
