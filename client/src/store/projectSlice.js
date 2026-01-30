import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data.project;
  }
);

export const updateProjectProgress = createAsyncThunk(
  'projects/updateProgress',
  async ({ projectId, progress }) => {
    const response = await api.patch(`/projects/${projectId}`, { progress });
    return response.data.project;
  }
);

export const addProjectUpdate = createAsyncThunk(
  'projects/addUpdate',
  async ({ projectId, title, content, attachments = [] }) => {
    const response = await api.post(`/projects/${projectId}/updates`, {
      title,
      content,
      attachments
    });
    return response.data;
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    total: 0,
    totalPages: 1,
    currentPage: 1
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    updateProjectInList: (state, action) => {
      const index = state.projects.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.currentProject?._id === action.payload._id) {
        state.currentProject = action.payload;
      }
    },
    addProjectUpdateLocal: (state, action) => {
      if (state.currentProject) {
        state.currentProject.updates = state.currentProject.updates || [];
        state.currentProject.updates.push(action.payload);
      }
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects || [];
        state.total = action.payload.total || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateProjectProgress.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(addProjectUpdate.fulfilled, (state, action) => {
        if (state.currentProject?._id === action.payload.project._id) {
          state.currentProject = action.payload.project;
        }
        const index = state.projects.findIndex(p => p._id === action.payload.project._id);
        if (index !== -1) {
          state.projects[index] = action.payload.project;
        }
      });
  }
});

export const { setCurrentProject, updateProjectInList, addProjectUpdateLocal, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;

