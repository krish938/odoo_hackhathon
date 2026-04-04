import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,

      // Actions
      login: (userData, token) => {
        localStorage.setItem('pos_token', token);
        set({
          user: userData,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_auth');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set({
          user: { ...get().user, ...userData },
        });
      },

      // Check if user has specific role or higher
      hasRole: (requiredRole) => {
        const { user } = get();
        if (!user) return false;
        
        const roleHierarchy = {
          admin: 3,
          manager: 2,
          staff: 1,
        };
        
        const userRoleLevel = roleHierarchy[user.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
        
        return userRoleLevel >= requiredRoleLevel;
      },

      // Check if user has specific permission
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;

        // Admin has all permissions
        if (user.role === 'admin') return true;

        // Define permissions based on role
        const permissions = {
          manager: [
            'products.create', 'products.edit', 'products.view',
            'categories.create', 'categories.edit', 'categories.view',
            'attributes.create', 'attributes.edit', 'attributes.view',
            'floors.create', 'floors.edit', 'floors.view',
            'tables.create', 'tables.edit', 'tables.view',
            'terminals.create', 'terminals.edit', 'terminals.view',
            'reports.view', 'sessions.open', 'sessions.close',
          ],
          staff: [
            'products.view', 'categories.view', 'attributes.view',
            'floors.view', 'tables.view', 'terminals.view',
            'sessions.open', 'pos.use',
          ],
        };

        return permissions[user.role]?.includes(permission) || false;
      },
    }),
    {
      name: 'pos_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
