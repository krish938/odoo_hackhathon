import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, login, logout, hasRole, hasPermission } = useAuthStore();

  // Auto-logout on token expiration
  useEffect(() => {
    if (token) {
      // Set up token expiration check
      const checkTokenExpiration = () => {
        try {
          // Decode JWT token to check expiration
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp < currentTime) {
            logout();
            navigate('/login');
          }
        } catch {
          logout();
          navigate('/login');
        }
      };

      // Check immediately and then every minute
      checkTokenExpiration();
      const interval = setInterval(checkTokenExpiration, 60000);

      return () => clearInterval(interval);
    }
  }, [token, logout, navigate]);

  // Check if user can access a route
  const canAccess = (requiredRole) => {
    return hasRole(requiredRole);
  };

  // Check if user has specific permission
  const hasAccess = (permission) => {
    return hasPermission(permission);
  };

  // Logout with API call
  const handleLogout = async () => {
    try {
      // Call logout endpoint if available
      await api.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout: handleLogout,
    canAccess,
    hasAccess,
    hasRole,
    hasPermission,
  };
};
