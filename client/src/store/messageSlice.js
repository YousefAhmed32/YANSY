import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// Async thunks
export const fetchThreadByProject = createAsyncThunk(
  'messages/fetchThreadByProject',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/projects/${projectId}/thread`);
      return response.data;
    } catch (error) {
      // Thread might not exist yet, return null
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch thread');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ threadId, content, attachments = [] }) => {
    const response = await api.post(`/messages/threads/${threadId}/messages`, {
      content,
      attachments
    });
    return response.data.message;
  }
);

export const createThreadAndMessage = createAsyncThunk(
  'messages/createThreadAndMessage',
  async ({ recipient, project, content, attachments = [] }) => {
    const response = await api.post('/messages/threads', {
      recipient,
      project,
      content,
      attachments
    });
    return response.data;
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    currentThread: null,
    messages: [],
    loading: false,
    error: null
  },
  reducers: {
    setCurrentThread: (state, action) => {
      state.currentThread = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(m => m._id === action.payload._id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentThread = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreadByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreadByProject.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentThread = action.payload.thread;
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
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(createThreadAndMessage.fulfilled, (state, action) => {
        state.currentThread = action.payload.thread;
        state.messages.push(action.payload.message);
      });
  }
});

export const { setCurrentThread, addMessage, updateMessage, clearMessages } = messageSlice.actions;
export default messageSlice.reducer;

