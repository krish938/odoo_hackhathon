import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import usePosStore from '../store/posStore';
import Button from '../components/ui/Button';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Palette, 
  CreditCard, 
  Building, 
  Table, 
  Monitor, 
  BarChart2, 
  Coffee, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { clearSession } = usePosStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    logout();
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/backend/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Products',
      href: '/backend/products',
      icon: Package,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Categories',
      href: '/backend/categories',
      icon: Tags,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Attributes',
      href: '/backend/attributes',
      icon: Palette,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Payment Methods',
      href: '/backend/payment-methods',
      icon: CreditCard,
      roles: ['admin'],
    },
    {
      name: 'Floors & Tables',
      href: '/backend/floors',
      icon: Building,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Terminals',
      href: '/backend/terminals',
      icon: Monitor,
      roles: ['admin', 'manager'],
    },
    {
      name: 'Reports',
      href: '/backend/reports',
      icon: BarChart2,
      roles: ['admin', 'manager'],
    },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-page-bg flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black opacity-50" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">
                Odoo POS Cafe
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive(item.href)
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Open POS Session Button */}
          <div className="px-4 pb-4">
            <Button
              onClick={() => navigate('/pos/open-session')}
              className="w-full bg-success hover:bg-green-700"
            >
              Open POS Session
            </Button>
          </div>

          {/* User info and logout */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-600">
                <User className="h-5 w-5 text-gray-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Odoo POS Cafe
            </h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
