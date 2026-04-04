import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role (if roles are specified)
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      // Redirect to appropriate area if unauthorized
      if (hasRole('staff')) {
        return <Navigate to="/pos/floor" state={{ error: '403' }} replace />;
      }
      return <Navigate to="/backend/dashboard" state={{ error: '403' }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
