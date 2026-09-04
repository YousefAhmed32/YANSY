import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Only gate on `loading` before we have ever resolved a user (the
  // initial boot-time auth check in App.jsx). `state.auth.loading` is
  // shared by every `getMe()` dispatch app-wide, including background
  // refreshes fired from deep inside already-mounted authenticated pages
  // (e.g. OnboardingWizard re-fetching the user after completing setup).
  // Gating on bare `loading` unmounted this entire subtree — Layout, and
  // whatever page was rendering — for the duration of every one of those
  // refreshes, then remounted it fresh once the call resolved. A page that
  // reads freshly-updated redux state in its own effects (like the
  // onboarding wizard's own success-screen guard) would see a brand-new
  // mount with already-updated data instead of its own in-flight state.
  if (loading && !user) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // A customer needs the activation flow only when we're genuinely missing
  // a way to reach them. Local registration already requires a phone number
  // at signup, so this only ever fires for OAuth (Google) sign-ups that
  // skipped that step — the check is provider-agnostic on purpose, so local
  // and Google accounts are gated by the exact same rule instead of two
  // different code paths. Once a phone exists (from registration, an OAuth
  // profile, or a completed activation flow) the customer is never sent
  // back here, regardless of the `isProfileComplete` flag's history.
  const needsOnboarding =
    !user?.phoneNumber &&
    !user?.isProfileComplete &&
    user?.role !== 'ADMIN' &&
    user?.role !== 'SUPER_ADMIN';

  if (needsOnboarding && location.pathname !== '/app/onboarding') {
    return <Navigate to="/app/onboarding" replace />;
  }

  if (requireAdmin && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
