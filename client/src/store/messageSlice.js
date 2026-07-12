import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchInbox = createAsyncThunk(
  'messages/fetchInbox',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/messages/threads');
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data?.threads || res.data?.data || []);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch inbox');
    }
  }
);

export const fetchThreadByProject = createAsyncThunk(
  'messages/fetchThreadByProject',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/projects/${projectId}/thread`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch thread');
    }
  }
);

export const fetchThreadMessages = createAsyncThunk(
  'messages/fetchThreadMessages',
  async (threadId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/threads/${threadId}/messages`);
      const msgs = Array.isArray(res.data) ? res.data : (res.data?.messages || []);
      return { threadId, messages: msgs };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ threadId, content, attachments = [] }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/messages/threads/${threadId}/messages`, {
        content,
        attachments,
      });
      return { threadId, message: response.data.message || response.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to send');
    }
  }
);

export const createThreadAndMessage = createAsyncThunk(
  'messages/createThreadAndMessage',
  async ({ recipient, project, content, attachments = [] }, { rejectWithValue }) => {
    try {
      const response = await api.post('/messages/threads', {
        recipient,
        project,
        content,
        attachments,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create thread');
    }
  }
);

export const markThreadRead = createAsyncThunk(
  'messages/markThreadRead',
  async (threadId, { rejectWithValue }) => {
    try {
      await api.patch(`/messages/threads/${threadId}/read`);
      return threadId;
    } catch {
      return threadId; // silent — still mark locally
    }
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const countUnread = (threads) =>
  threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

// ── Slice ─────────────────────────────────────────────────────────────────────

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    // Inbox
    threads: [],
    inboxLoading: false,

    // Active thread
    activeThreadId: null,
    currentThread: null,
    messages: [],
    loading: false,
    sending: false,
    error: null,

    // Counts
    totalUnread: 0,
  },
  reducers: {
    setActiveThread: (state, action) => {
      state.activeThreadId = action.payload;
    },
    setCurrentThread: (state, action) => {
      state.currentThread = action.payload;
    },
    addMessage: (state, action) => {
      const { message, threadId } = action.payload;
      if (message) {
        // Check for duplicate
        const exists = state.messages.find(m => m._id === message._id);
        if (!exists) state.messages.push(message);
      }
      // Update thread's lastMessage in inbox
      const thread = state.threads.find(t => t._id === threadId);
      if (thread && message) {
        thread.lastMessage = message.content || message.text || '';
        thread.updatedAt = message.createdAt || new Date().toISOString();
      }
    },
    updateMessage: (state, action) => {
      const idx = state.messages.findIndex(m => m._id === action.payload._id);
      if (idx !== -1) state.messages[idx] = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentThread = null;
      state.activeThreadId = null;
    },
    pushIncomingMessage: (state, action) => {
      // Called via socket for real-time messages
      const { message, threadId } = action.payload;
      if (state.activeThreadId === threadId) {
        const exists = state.messages.find(m => m._id === message._id);
        if (!exists) state.messages.push(message);
      }
      const thread = state.threads.find(t => t._id === threadId);
      if (thread) {
        thread.lastMessage = message.content || message.text || '';
        thread.updatedAt = message.createdAt || new Date().toISOString();
        if (state.activeThreadId !== threadId) {
          thread.unreadCount = (thread.unreadCount || 0) + 1;
          state.totalUnread = countUnread(state.threads);
        }
      }
    },
    markThreadReadLocal: (state, action) => {
      const thread = state.threads.find(t => t._id === action.payload);
      if (thread) {
        state.totalUnread = Math.max(0, state.totalUnread - (thread.unreadCount || 0));
        thread.unreadCount = 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchInbox ────────────────────────────────────────────────────────
      .addCase(fetchInbox.pending, (state) => {
        state.inboxLoading = true;
      })
      .addCase(fetchInbox.fulfilled, (state, action) => {
        state.inboxLoading = false;
        state.threads = action.payload;
        state.totalUnread = countUnread(action.payload);
      })
      .addCase(fetchInbox.rejected, (state) => {
        state.inboxLoading = false;
        state.threads = [];
      })

      // ── fetchThreadByProject ─────────────────────────────────────────────
      .addCase(fetchThreadByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreadByProject.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentThread = action.payload.thread;
          state.activeThreadId = action.payload.thread?._id || null;
          state.messages = action.payload.messages || [];
        } else {
          state.currentThread = null;
          state.messages = [];
        }
      })
      .addCase(fetchThreadByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // ── fetchThreadMessages ──────────────────────────────────────────────
      .addCase(fetchThreadMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchThreadMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.activeThreadId = action.payload.threadId;
      })
      .addCase(fetchThreadMessages.rejected, (state) => {
        state.loading = false;
      })

      // ── sendMessage ──────────────────────────────────────────────────────
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const { threadId, message } = action.payload;
        if (message) {
          const exists = state.messages.find(m => m._id === message._id);
          if (!exists) state.messages.push(message);
        }
        const thread = state.threads.find(t => t._id === threadId);
        if (thread && message) {
          thread.lastMessage = message.content || message.text || '';
          thread.updatedAt = message.createdAt || new Date().toISOString();
        }
      })
      .addCase(sendMessage.rejected, (state) => {
        state.sending = false;
      })

      // ── createThreadAndMessage ───────────────────────────────────────────
      .addCase(createThreadAndMessage.fulfilled, (state, action) => {
        const { thread, message } = action.payload;
        if (thread) {
          state.currentThread = thread;
          state.activeThreadId = thread._id;
          const exists = state.threads.find(t => t._id === thread._id);
          if (!exists) state.threads.unshift(thread);
        }
        if (message) state.messages.push(message);
      })

      // ── markThreadRead ───────────────────────────────────────────────────
      .addCase(markThreadRead.fulfilled, (state, action) => {
        const thread = state.threads.find(t => t._id === action.payload);
        if (thread) {
          state.totalUnread = Math.max(0, state.totalUnread - (thread.unreadCount || 0));
          thread.unreadCount = 0;
        }
      });
  },
});

export const {
  setActiveThread, setCurrentThread, addMessage, updateMessage,
  clearMessages, pushIncomingMessage, markThreadReadLocal,
} = messageSlice.actions;

export default messageSlice.reducer;
