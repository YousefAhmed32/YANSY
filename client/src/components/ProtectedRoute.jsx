import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute Component
 * Protects routes that require authentication
 * 
 * @param {ReactNode} children - Child components to render
 * @param {boolean} requireAdmin - Requires admin role (default: false)
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Require authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Require admin role
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

