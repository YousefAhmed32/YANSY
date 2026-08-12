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
import IntroOverlay from './components/IntroOverlay';
import { trackPageView } from './utils/ga4';
import { trackPageView as trackMetaPageView } from './utils/metaPixel';

import './i18n/config';
import './index.css';

// ── Eager: critical path ──────────────────────────────────────────────────────
import Home from './pages/Home';

// ── Lazy: all other routes ───────────────────────────────────────────────────
const Layout          = lazy(() => import('./components/Layout'));
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const Portfolio       = lazy(() => import('./pages/Portfolio'));
const Industries      = lazy(() => import('./pages/Industries'));
const WhyYansyPage    = lazy(() => import('./pages/WhyYansyPage'));
const ContactPage     = lazy(() => import('./pages/ContactPage'));
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
const PortfolioWizard = lazy(() => import('./pages/PortfolioWizard'));
const PortfolioPreview = lazy(() => import('./pages/PortfolioPreview'));
const AdminIntro      = lazy(() => import('./pages/AdminIntro'));
const AdminHomepageVideo = lazy(() => import('./pages/AdminHomepageVideo'));
const AdminClientLogos = lazy(() => import('./pages/AdminClientLogos'));
const AdminLibrary       = lazy(() => import('./pages/AdminLibrary'));
const AdminMediaLibrary  = lazy(() => import('./pages/AdminMediaLibrary'));
const AdminStartProject  = lazy(() => import('./pages/AdminStartProject'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const Invoices        = lazy(() => import('./pages/Invoices'));
const AdminAuditLog   = lazy(() => import('./pages/AdminAuditLog'));
const NotFound        = lazy(() => import('./pages/NotFound'));
const BillingPage     = lazy(() => import('./pages/BillingPage'));
const Support         = lazy(() => import('./pages/Support'));
const Payments        = lazy(() => import('./pages/Payments'));
const Account         = lazy(() => import('./pages/Account'));
const AdminAI             = lazy(() => import('./pages/AdminAI'));
const AdminSettings       = lazy(() => import('./pages/AdminSettings'));
const AdminHealth         = lazy(() => import('./pages/AdminHealth'));
const AdminFinancial      = lazy(() => import('./pages/AdminFinancial'));
const AdminRoles          = lazy(() => import('./pages/AdminRoles'));
const AdminNotifications  = lazy(() => import('./pages/AdminNotifications'));
const AdminReports        = lazy(() => import('./pages/AdminReports'));
const AdminCRM            = lazy(() => import('./pages/AdminCRM'));
const AdminSupportAI      = lazy(() => import('./pages/AdminSupportAI'));
const AdminMessages       = lazy(() => import('./pages/AdminMessages'));
const AdminAnalytics      = lazy(() => import('./pages/AdminAnalytics'));
const VerifyEmail         = lazy(() => import('./pages/VerifyEmail'));
const OnboardingWizard    = lazy(() => import('./pages/OnboardingWizard'));
const Meetings            = lazy(() => import('./pages/Meetings'));
const ActivityTimeline    = lazy(() => import('./pages/ActivityTimeline'));
const AdminBlog           = lazy(() => import('./pages/AdminBlog'));
const ProposalPublicPage        = lazy(() => import('./pages/ProposalPublicPage'));
const AdminProposals            = lazy(() => import('./pages/AdminProposals'));
const AdminProposalEditor       = lazy(() => import('./pages/AdminProposalEditor'));
const AdminProposalTemplates    = lazy(() => import('./pages/AdminProposalTemplates'));
const AdminProposalTemplateEditor = lazy(() => import('./pages/AdminProposalTemplateEditor'));
const AdminProposalImport       = lazy(() => import('./pages/AdminProposalImport'));
const AdminProposalImportEditor = lazy(() => import('./pages/AdminProposalImportEditor'));

/* ── Branded page loader ──────────────────────────────────────────────────── */
const PageLoader = () => (
  <div
    style={{ background: '#FFFFFF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    aria-label="Loading"
    role="status"
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div
        aria-hidden
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '2px solid #E7EAF0',
          borderTopColor: '#2563EB',
          animation: 'ys-spin 0.75s linear infinite',
        }}
      />
      <span
        aria-hidden
        style={{
          fontFamily: "'Inter',system-ui,sans-serif",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#9CA3AF',
          fontWeight: 600,
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
    trackMetaPageView();
  }, [location.pathname, location.search]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<PageLoader />}>
        {/*
          The key on Routes triggers AnimatePresence when the pathname changes.
          mode="wait" ensures the exit animation completes before the new route enters.
        */}
        <Routes location={location} key={location.pathname}>

          {/* ── Public — wrapped in PageTransition for cinematic navigation. ── */}
          <Route path="/"          element={<PageTransition><Home /></PageTransition>} />
          <Route path="/home"      element={<PageTransition><Home /></PageTransition>} />
          <Route path="/case-studies" element={<PageTransition><CaseStudies /></PageTransition>} />
          <Route path="/case-studies/:slug" element={<PageTransition><CaseStudyDetail /></PageTransition>} />
          <Route path="/blog"  element={<PageTransition><Blog /></PageTransition>} />
          <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
          <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
          <Route path="/portfolio/:id" element={<PageTransition><PortfolioDetail /></PageTransition>} />
          <Route path="/industries" element={<PageTransition><Industries /></PageTransition>} />
          <Route path="/why-yansy" element={<PageTransition><WhyYansyPage /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
          <Route path="/feedback"  element={<PageTransition><FeedbackForm /></PageTransition>} />
          {/* /process retired — its content lives on the homepage and inside the Contact page's process timeline */}
          <Route path="/process"  element={<Navigate to="/contact" replace />} />
          <Route path="/pricing"  element={<Navigate to="/contact" replace />} />

          {/* ── Public proposal page — no site Header/Footer, no PageTransition:
              a shared proposal link is its own branded document (see
              ProposalRenderer), not a page inside the marketing site's nav. ── */}
          <Route path="/p/:slug" element={<ProposalPublicPage />} />

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
            <Route path="projects"   element={<Projects />} />
            <Route path="projects/new" element={<AddProject />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="messages"   element={<Messages />} />
            <Route path="invoices"   element={<Invoices />} />
            <Route path="billing"    element={<BillingPage />} />
            {/* New merged pages */}
            <Route path="payments"   element={<Payments />} />
            <Route path="account"    element={<Account />} />
            <Route path="support"    element={<Support />} />
            {/* New pages */}
            <Route path="meetings"  element={<Meetings />} />
            <Route path="activity"  element={<ActivityTimeline />} />
            {/* Legacy redirects — keep old links working */}
            <Route path="profile"    element={<Navigate to="/app/account" replace />} />
            <Route path="settings"   element={<Navigate to="/app/account" replace />} />

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
              path="admin/portfolio/new"
              element={<ProtectedRoute requireAdmin><PortfolioWizard /></ProtectedRoute>}
            />
            <Route
              path="admin/portfolio/:id/edit"
              element={<ProtectedRoute requireAdmin><PortfolioWizard /></ProtectedRoute>}
            />
            <Route
              path="admin/portfolio/:id/preview"
              element={<ProtectedRoute requireAdmin><PortfolioPreview /></ProtectedRoute>}
            />
            <Route
              path="admin/intro"
              element={<ProtectedRoute requireAdmin><AdminIntro /></ProtectedRoute>}
            />
            <Route
              path="admin/homepage-video"
              element={<ProtectedRoute requireAdmin><AdminHomepageVideo /></ProtectedRoute>}
            />
            <Route
              path="admin/client-logos"
              element={<ProtectedRoute requireAdmin><AdminClientLogos /></ProtectedRoute>}
            />
            <Route
              path="admin/start-project"
              element={<ProtectedRoute requireAdmin><AdminStartProject /></ProtectedRoute>}
            />
            <Route
              path="admin/media-library"
              element={<ProtectedRoute requireAdmin><AdminMediaLibrary /></ProtectedRoute>}
            />
            <Route
              path="admin/libraries/:libraryKey"
              element={<ProtectedRoute requireAdmin><AdminLibrary /></ProtectedRoute>}
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
              path="admin/messages"
              element={<ProtectedRoute requireAdmin><AdminMessages /></ProtectedRoute>}
            />
            <Route
              path="admin/analytics"
              element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>}
            />
            <Route
              path="admin/blog"
              element={<ProtectedRoute requireAdmin><AdminBlog /></ProtectedRoute>}
            />
            <Route
              path="admin/proposals"
              element={<ProtectedRoute requireAdmin><AdminProposals /></ProtectedRoute>}
            />
            <Route
              path="admin/proposals/new"
              element={<ProtectedRoute requireAdmin><AdminProposalEditor /></ProtectedRoute>}
            />
            <Route
              path="admin/proposals/:id/edit"
              element={<ProtectedRoute requireAdmin><AdminProposalEditor /></ProtectedRoute>}
            />
            <Route
              path="admin/proposals/import"
              element={<ProtectedRoute requireAdmin><AdminProposalImport /></ProtectedRoute>}
            />
            <Route
              path="admin/proposals/:id/edit-html"
              element={<ProtectedRoute requireAdmin><AdminProposalImportEditor /></ProtectedRoute>}
            />
            <Route
              path="admin/proposal-templates"
              element={<ProtectedRoute requireAdmin><AdminProposalTemplates /></ProtectedRoute>}
            />
            <Route
              path="admin/proposal-templates/:id/edit"
              element={<ProtectedRoute requireAdmin><AdminProposalTemplateEditor /></ProtectedRoute>}
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
        // Only drop the stored token when the server confirmed it's actually
        // invalid/expired — not on a transient DB/network failure during boot.
        .catch((err) => { if (err?.sessionInvalid) localStorage.removeItem('token'); })
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
        {/* Cinematic opening sequence — home route only, renders nothing when ineligible */}
        <IntroOverlay />
      </BrowserRouter>
    </>
  );
}

export default App;
