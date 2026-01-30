import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getMe } from './store/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import ProjectRequests from './pages/ProjectRequests';
import AddProject from './pages/AddProject';
import FeedbackForm from './pages/FeedbackForm';
import AdminFeedback from './pages/AdminFeedback';
import { initSession } from './utils/analytics';
import { initTheme } from './utils/theme';
import { applyLanguageDirection } from './utils/rtl';
import Toast from './components/Toast';
import './i18n/config';
import './index.css';

function App() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Session initialization
    initSession();
    
    // Verify token on app load
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getMe());
    }
    // Theme and language are now handled by context providers
  }, [dispatch]);

  return (
    <>
      <Toast />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          
          {/* Protected App Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* User-only routes */}
            <Route
              path="projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="projects/new"
              element={
                <ProtectedRoute>
                  <AddProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            
            {/* Admin-only routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/project-requests"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ProjectRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/feedback"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminFeedback />
                </ProtectedRoute>
              }
            />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
