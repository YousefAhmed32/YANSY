import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// ── Async Thunks ──────────────────────────────────────────────────────────────

// The server populates `lastMessage` as the full Message document (sender,
// attachments, etc. — see server/controllers/messageController.js getThreads),
// not a plain string. Every other place a thread's preview gets set locally
// (pushIncomingMessage, addOptimisticMessage, sendMessage.fulfilled, below)
// writes a plain string. Normalizing here, at the single point this
// populated shape enters the client, keeps every downstream reader (both
// Messages.jsx and AdminMessages.jsx) able to just render `thread.lastMessage`
// directly — without this, a populated object rendered as text prints the
// literal string "[object Object]".
const previewTextFor = (lastMessage) => {
  if (!lastMessage) return '';
  if (typeof lastMessage === 'string') return lastMessage;
  if (lastMessage.content) return lastMessage.content;
  if (Array.isArray(lastMessage.attachments) && lastMessage.attachments.length) return '📎 Attachment';
  return '';
};

export const fetchInbox = createAsyncThunk(
  'messages/fetchInbox',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/messages/threads');
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data?.threads || res.data?.data || []);
      return data.map(t => ({ ...t, lastMessage: previewTextFor(t.lastMessage) }));
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch inbox');
    }
  }
);

// Separate from fetchInbox (which always loads the default, non-archived
// list the unread badge/counts are based on) — the "Archived" filter tab
// loads this on demand into its own bucket, so switching tabs never clobbers
// the primary inbox or its unread count.
export const fetchArchivedInbox = createAsyncThunk(
  'messages/fetchArchivedInbox',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/messages/threads', { params: { archived: 'true' } });
      const data = Array.isArray(res.data) ? res.data : (res.data?.threads || res.data?.data || []);
      return data.map(t => ({ ...t, lastMessage: previewTextFor(t.lastMessage) }));
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch archived conversations');
    }
  }
);

// PATCH /messages/threads/:id/archive — real, working for both roles (a
// customer may archive/unarchive their own thread; see
// server/controllers/messageController.js archiveThread). Moves the thread
// between the two local lists to match, rather than refetching both.
export const setThreadArchived = createAsyncThunk(
  'messages/setThreadArchived',
  async ({ threadId, archived }, { rejectWithValue }) => {
    try {
      await api.patch(`/messages/threads/${threadId}/archive`, { archived });
      return { threadId, archived };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update conversation');
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

// The real endpoint is `GET /messages/threads/:id` — returns { thread,
// messages, hasMore } and marks the thread read as a side effect (initial
// page only; see server/controllers/messageController.js).
export const fetchThreadMessages = createAsyncThunk(
  'messages/fetchThreadMessages',
  async (threadId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/threads/${threadId}`);
      return {
        threadId,
        messages: res.data?.messages || [],
        thread: res.data?.thread || null,
        hasMore: !!res.data?.hasMore,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load messages');
    }
  }
);

// Pages further back into history — `before` is the oldest currently-loaded
// message's createdAt. Prepends to the existing list; the caller is
// responsible for preserving scroll position around the prepend.
export const fetchOlderMessages = createAsyncThunk(
  'messages/fetchOlderMessages',
  async ({ threadId, before }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/threads/${threadId}`, { params: { before } });
      return { threadId, messages: res.data?.messages || [], hasMore: !!res.data?.hasMore };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load older messages');
    }
  }
);

// `tempId` is carried through meta.arg (not the payload) purely so the
// pending/fulfilled/rejected reducers below can find the matching optimistic
// placeholder without the caller having to thread it through by hand.
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  // `tempId` isn't read inside this function — it's read back out via
  // `action.meta.arg.tempId` in the pending/fulfilled/rejected reducers
  // below, which is why it isn't destructured here.
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

// Two-step attachment flow: upload the file first (this thunk), get back a
// File document, then include its id in the next sendMessage/createThreadAndMessage
// call — the same "attach, preview, then send" pattern every chat app uses.
// Deliberately not thread-scoped — the file may be attached to a brand-new
// conversation that doesn't have a thread id yet.
export const uploadAttachment = createAsyncThunk(
  'messages/uploadAttachment',
  async ({ file, onProgress }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/messages/attachments', formData, {
        // The shared `api` instance defaults to Content-Type: application/json
        // for every request — explicitly unsetting it here (rather than
        // hardcoding 'multipart/form-data', which would omit the required
        // boundary) lets the browser's XHR generate the correct multipart
        // Content-Type + boundary itself from the FormData body.
        headers: { 'Content-Type': undefined },
        onUploadProgress: (evt) => {
          if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      return res.data?.file;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Upload failed');
    }
  }
);

// No dedicated "mark read" endpoint exists (and none is needed) — the real
// GET /messages/threads/:id endpoint that fetchThreadMessages calls already
// marks the thread read server-side as a side effect of loading it. This
// thunk previously PATCHed a `/threads/:id/read` route that never existed
// (a silent 404, swallowed by the catch below) and did nothing real; it's
// kept only so existing dispatch(markThreadRead(id)) call sites still work
// as a harmless local no-op alongside markThreadReadLocal.
export const markThreadRead = createAsyncThunk(
  'messages/markThreadRead',
  async (threadId) => threadId
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

    // Archived tab — separate bucket, see fetchArchivedInbox.
    archivedThreads: [],
    archivedLoading: false,
    archiveActionThreadId: null, // thread currently being archived/unarchived (for a per-row spinner)

    // Active thread
    activeThreadId: null,
    currentThread: null,
    messages: [],
    loading: false,
    loadingOlder: false,
    hasMoreOlder: false,
    sending: false,
    error: null,

    // Typing — { [userId]: true } for the active thread only
    typingUsers: {},

    // Counts
    totalUnread: 0,
  },
  reducers: {
    setActiveThread: (state, action) => {
      state.activeThreadId = action.payload;
      state.typingUsers = {};
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
      state.hasMoreOlder = false;
      state.typingUsers = {};
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
    // Everyone else in the thread just read up to now — flip our own
    // outgoing messages to "read" so the double-check mark updates live
    // instead of only after a manual refresh.
    markMessagesReadByOthers: (state, action) => {
      const { threadId, readerId } = action.payload;
      if (state.activeThreadId !== threadId) return;
      state.messages.forEach(m => {
        const senderId = m.sender?._id || m.sender;
        if (senderId && senderId !== readerId) m.isRead = true;
      });
    },
    setUserTyping: (state, action) => {
      const { userId, typing } = action.payload;
      if (!userId) return;
      if (typing) state.typingUsers[userId] = true;
      else delete state.typingUsers[userId];
    },
    // ── Optimistic send lifecycle ────────────────────────────────────────
    addOptimisticMessage: (state, action) => {
      const { tempId, threadId, message } = action.payload;
      if (state.activeThreadId === threadId) {
        state.messages.push({ ...message, _id: tempId, status: 'sending' });
      }
      const thread = state.threads.find(t => t._id === threadId);
      if (thread) {
        thread.lastMessage = message.content || (message.attachments?.length ? '📎 Attachment' : '');
        thread.updatedAt = new Date().toISOString();
      }
    },
    retryFailedMessage: (state, action) => {
      const m = state.messages.find(m => m._id === action.payload);
      if (m) { m.status = 'sending'; m.error = null; }
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

      // ── fetchArchivedInbox ────────────────────────────────────────────────
      .addCase(fetchArchivedInbox.pending, (state) => {
        state.archivedLoading = true;
      })
      .addCase(fetchArchivedInbox.fulfilled, (state, action) => {
        state.archivedLoading = false;
        state.archivedThreads = action.payload;
      })
      .addCase(fetchArchivedInbox.rejected, (state) => {
        state.archivedLoading = false;
      })

      // ── setThreadArchived ─────────────────────────────────────────────────
      .addCase(setThreadArchived.pending, (state, action) => {
        state.archiveActionThreadId = action.meta.arg.threadId;
      })
      .addCase(setThreadArchived.fulfilled, (state, action) => {
        state.archiveActionThreadId = null;
        const { threadId, archived } = action.payload;
        if (archived) {
          const moved = state.threads.find(t => t._id === threadId);
          state.threads = state.threads.filter(t => t._id !== threadId);
          if (moved) state.archivedThreads = [{ ...moved }, ...state.archivedThreads];
          if (state.activeThreadId === threadId) state.activeThreadId = null;
        } else {
          const moved = state.archivedThreads.find(t => t._id === threadId);
          state.archivedThreads = state.archivedThreads.filter(t => t._id !== threadId);
          if (moved) state.threads = [{ ...moved }, ...state.threads];
        }
        state.totalUnread = countUnread(state.threads);
      })
      .addCase(setThreadArchived.rejected, (state) => {
        state.archiveActionThreadId = null;
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
        state.hasMoreOlder = action.payload.hasMore;
        state.typingUsers = {};
        if (action.payload.thread) {
          state.currentThread = action.payload.thread;
          // The thread just came back freshly marked-read server-side —
          // reflect that in the inbox list immediately instead of waiting
          // for the next fetchInbox poll.
          const inboxEntry = state.threads.find(t => t._id === action.payload.threadId);
          if (inboxEntry) {
            state.totalUnread = Math.max(0, state.totalUnread - (inboxEntry.unreadCount || 0));
            inboxEntry.unreadCount = 0;
          }
        }
      })
      .addCase(fetchThreadMessages.rejected, (state) => {
        state.loading = false;
      })

      // ── fetchOlderMessages ────────────────────────────────────────────────
      .addCase(fetchOlderMessages.pending, (state) => {
        state.loadingOlder = true;
      })
      .addCase(fetchOlderMessages.fulfilled, (state, action) => {
        state.loadingOlder = false;
        if (action.payload.threadId !== state.activeThreadId) return;
        const existingIds = new Set(state.messages.map(m => m._id));
        const older = action.payload.messages.filter(m => !existingIds.has(m._id));
        state.messages = [...older, ...state.messages];
        state.hasMoreOlder = action.payload.hasMore;
      })
      .addCase(fetchOlderMessages.rejected, (state) => {
        state.loadingOlder = false;
      })

      // ── sendMessage ──────────────────────────────────────────────────────
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const { threadId, message } = action.payload;
        const tempId = action.meta.arg.tempId;
        if (tempId) {
          const tempIdx = state.messages.findIndex(m => m._id === tempId);
          if (tempIdx !== -1) state.messages.splice(tempIdx, 1);
        }
        if (message) {
          // A socket echo (message-received, sent to every thread-room
          // member including the sender) may have already landed this exact
          // message while the HTTP request was in flight — dedupe by real id.
          const exists = state.messages.find(m => m._id === message._id);
          if (!exists) state.messages.push(message);
        }
        const thread = state.threads.find(t => t._id === threadId);
        if (thread && message) {
          thread.lastMessage = message.content || message.text || '';
          thread.updatedAt = message.createdAt || new Date().toISOString();
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        const tempId = action.meta.arg.tempId;
        if (tempId) {
          const m = state.messages.find(m => m._id === tempId);
          if (m) { m.status = 'failed'; m.error = action.payload; }
        }
      })

      // ── createThreadAndMessage ───────────────────────────────────────────
      .addCase(createThreadAndMessage.fulfilled, (state, action) => {
        const { thread, message } = action.payload;
        if (thread) {
          state.currentThread = thread;
          state.activeThreadId = thread._id;
          // The freshly-created thread comes back with `lastMessage` as an
          // unpopulated ObjectId (createThread's re-fetch doesn't populate
          // it) — use the message we already have in hand instead of
          // rendering that id as text.
          const withPreview = { ...thread, lastMessage: previewTextFor(message) || previewTextFor(thread.lastMessage) };
          const exists = state.threads.find(t => t._id === thread._id);
          if (!exists) state.threads.unshift(withPreview);
          else Object.assign(exists, withPreview);
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
  markMessagesReadByOthers, setUserTyping,
  addOptimisticMessage, retryFailedMessage,
} = messageSlice.actions;

export default messageSlice.reducer;
