import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { getMe } from './store/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';
import { trackPageView } from './utils/ga4';

import './i18n/config';
import './index.css';

// ── Eager: critical path ──────────────────────────────────────────────────────
import Home from './pages/Home';

// ── Lazy: all other routes ───────────────────────────────────────────────────
const Layout          = lazy(() => import('./components/Layout'));
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const Portfolio       = lazy(() => import('./pages/Portfolio'));
const Services        = lazy(() => import('./pages/Services'));
const ServiceDetail   = lazy(() => import('./pages/ServiceDetail'));
const CaseStudies     = lazy(() => import('./pages/CaseStudies'));
const CaseStudyDetail = lazy(() => import('./pages/CaseStudyDetail'));
const Blog            = lazy(() => import('./pages/Blog'));
const BlogPost        = lazy(() => import('./pages/BlogPost'));
const PortfolioDetail = lazy(() => import('./pages/PortfolioDetail'));
const FeedbackForm    = lazy(() => import('./pages/FeedbackForm'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const Projects        = lazy(() => import('./pages/Projects'));
const ProjectDetails  = lazy(() => import('./pages/ProjectDetails'));
const Messages        = lazy(() => import('./pages/Messages'));
const AddProject      = lazy(() => import('./pages/AddProject'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers      = lazy(() => import('./pages/AdminUsers'));
const ProjectRequests = lazy(() => import('./pages/ProjectRequests'));
const AdminFeedback   = lazy(() => import('./pages/AdminFeedback'));
const AdminPortfolio  = lazy(() => import('./pages/AdminPortfolio'));
const Profile         = lazy(() => import('./pages/Profile'));
const Settings        = lazy(() => import('./pages/Settings'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const Invoices        = lazy(() => import('./pages/Invoices'));
const AdminAuditLog   = lazy(() => import('./pages/AdminAuditLog'));
const NotFound        = lazy(() => import('./pages/NotFound'));
const Pricing         = lazy(() => import('./pages/Pricing'));
const BillingPage     = lazy(() => import('./pages/BillingPage'));
const AdminAI             = lazy(() => import('./pages/AdminAI'));
const AdminSettings       = lazy(() => import('./pages/AdminSettings'));
const AdminHealth         = lazy(() => import('./pages/AdminHealth'));
const AdminFinancial      = lazy(() => import('./pages/AdminFinancial'));
const AdminRoles          = lazy(() => import('./pages/AdminRoles'));
const AdminNotifications  = lazy(() => import('./pages/AdminNotifications'));
const AdminReports        = lazy(() => import('./pages/AdminReports'));
const AdminCRM            = lazy(() => import('./pages/AdminCRM'));
const AdminSupportAI      = lazy(() => import('./pages/AdminSupportAI'));
const AdminAnalytics      = lazy(() => import('./pages/AdminAnalytics'));
const VerifyEmail         = lazy(() => import('./pages/VerifyEmail'));
const OnboardingWizard    = lazy(() => import('./pages/OnboardingWizard'));

/* ── Branded page loader ──────────────────────────────────────────────────── */
const PageLoader = () => (
  <div
    className="bg-black min-h-screen flex items-center justify-center"
    aria-label="Loading"
    role="status"
  >
    {/* Brand wordmark + spinner */}
    <div className="flex flex-col items-center gap-6">
      <div
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1.5px solid rgba(212,175,55,0.12)',
          borderTopColor: '#d4af37',
          animation: 'ys-spin 0.85s linear infinite',
        }}
      />
      <span
        aria-hidden
        style={{
          fontFamily    : "'Inter',system-ui,sans-serif",
          fontSize      : 10,
          letterSpacing : '0.12em',
          textTransform : 'uppercase',
          color         : 'rgba(212,175,55,0.4)',
          fontWeight    : 500,
        }}
      >
        YANSY
      </span>
    </div>
    <style>{`@keyframes ys-spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

/* ── Animated routes — must live inside BrowserRouter to use useLocation ─── */
const AnimatedRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<PageLoader />}>
        {/*
          The key on Routes triggers AnimatePresence when the pathname changes.
          mode="wait" ensures the exit animation completes before the new route enters.
        */}
        <Routes location={location} key={location.pathname}>

          {/* ── Public — wrapped in PageTransition for cinematic navigation ── */}
          <Route path="/"          element={<PageTransition><Home /></PageTransition>} />
          <Route path="/home"      element={<PageTransition><Home /></PageTransition>} />
          <Route path="/services"  element={<PageTransition><Services /></PageTransition>} />
          <Route path="/services/:slug" element={<PageTransition><ServiceDetail /></PageTransition>} />
          <Route path="/case-studies" element={<PageTransition><CaseStudies /></PageTransition>} />
          <Route path="/case-studies/:slug" element={<PageTransition><CaseStudyDetail /></PageTransition>} />
          <Route path="/blog"  element={<PageTransition><Blog /></PageTransition>} />
          <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
          <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
          <Route path="/portfolio/:id" element={<PageTransition><PortfolioDetail /></PageTransition>} />
          <Route path="/feedback"  element={<PageTransition><FeedbackForm /></PageTransition>} />
          <Route path="/pricing"   element={<PageTransition><Pricing /></PageTransition>} />

          {/* ── Auth — no transition, instant ── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />

          {/* ── Protected ── */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="onboarding" element={<OnboardingWizard />} />
            <Route path="dashboard"  element={<Dashboard />} />
            <Route path="profile"    element={<Profile />} />
            <Route path="settings"   element={<Settings />} />
            <Route path="projects"   element={<Projects />} />
            <Route path="projects/new" element={<AddProject />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="messages"   element={<Messages />} />
            <Route path="invoices"   element={<Invoices />} />
            <Route path="billing"    element={<BillingPage />} />

            {/* Admin */}
            <Route
              path="admin"
              element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="admin/users"
              element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>}
            />
            <Route
              path="admin/project-requests"
              element={<ProtectedRoute requireAdmin><ProjectRequests /></ProtectedRoute>}
            />
            <Route
              path="admin/feedback"
              element={<ProtectedRoute requireAdmin><AdminFeedback /></ProtectedRoute>}
            />
            <Route
              path="admin/portfolio"
              element={<ProtectedRoute requireAdmin><AdminPortfolio /></ProtectedRoute>}
            />
            <Route
              path="admin/audit"
              element={<ProtectedRoute requireAdmin><AdminAuditLog /></ProtectedRoute>}
            />
            <Route
              path="admin/ai"
              element={<ProtectedRoute requireAdmin><AdminAI /></ProtectedRoute>}
            />
            <Route
              path="admin/settings"
              element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>}
            />
            <Route
              path="admin/health"
              element={<ProtectedRoute requireAdmin><AdminHealth /></ProtectedRoute>}
            />
            <Route
              path="admin/financial"
              element={<ProtectedRoute requireAdmin><AdminFinancial /></ProtectedRoute>}
            />
            <Route
              path="admin/roles"
              element={<ProtectedRoute requireAdmin><AdminRoles /></ProtectedRoute>}
            />
            <Route
              path="admin/notifications"
              element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>}
            />
            <Route
              path="admin/reports"
              element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>}
            />
            <Route
              path="admin/crm"
              element={<ProtectedRoute requireAdmin><AdminCRM /></ProtectedRoute>}
            />
            <Route
              path="admin/support"
              element={<ProtectedRoute requireAdmin><AdminSupportAI /></ProtectedRoute>}
            />
            <Route
              path="admin/analytics"
              element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>}
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

/* ── Root App ─────────────────────────────────────────────────────────────── */
function App() {
  const dispatch = useDispatch();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getMe())
        .unwrap()
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setAppReady(true));
    } else {
      setAppReady(true);
    }
  }, [dispatch]);

  // Show branded loader during auth check (not a blank screen)
  if (!appReady) return <PageLoader />;

  return (
    <>
      <Toast />
      <BrowserRouter>
        <ScrollToTop />
        {/* ErrorBoundary wraps all routes — catches any unhandled React errors */}
        <ErrorBoundary>
          <AnimatedRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </>
  );
}

export default App;
