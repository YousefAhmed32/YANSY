import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Google-login users without a phone number must complete onboarding first.
  // Skip this gate if they're already on the onboarding route or are admins.
  const needsOnboarding =
    user?.authProvider === 'google' &&
    !user?.isProfileComplete &&
    !user?.phoneNumber &&
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
