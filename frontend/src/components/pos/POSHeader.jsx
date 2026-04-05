import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import usePosStore from '../../store/posStore';
import Button from '../ui/Button';
import { Coffee, Home, ShoppingCart, ListOrdered, Settings, LogOut, ChevronDown, Monitor } from 'lucide-react';
import api from '../../api/axios';

const POSHeader = ({ onRefresh, loading }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeSession, clearSession } = usePosStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  const handleCloseSession = async () => {
    if (!window.confirm('Are you sure you want to close this session?')) return;
    
    try {
      setClosingSession(true);
      await api.post(`/api/sessions/${activeSession.id}/close`);
      clearSession();
      navigate('/backend/dashboard');
    } catch (error) {
      console.error('Failed to close session:', error);
    } finally {
      setClosingSession(false);
    }
  };

  const isActive = (path) => {
    // Basic exact match or partial match for order screens
    if (path === '/pos/floor' && location.pathname === '/pos/floor') return true;
    if (path === '/pos/register' && location.pathname.includes('/pos/order')) return true;
    if (path === '/pos/orders' && location.pathname === '/pos/orders') return true;
    return false;
  };

  const activeTabClasses = "text-primary border-b-2 border-primary";
  const inactiveTabClasses = "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent";

  return (
    <div className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between">
      <div className="flex items-center space-x-8 h-full">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/backend/dashboard')}>
          <Coffee className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Odoo POS</h1>
        </div>
        
        {/* Top-Level Tabs */}
        <div className="flex space-x-6 h-full items-center">
          <button
            onClick={() => navigate('/pos/floor')}
            className={`h-full px-2 flex items-center font-medium text-sm transition-colors ${isActive('/pos/floor') ? activeTabClasses : inactiveTabClasses}`}
          >
            <Home className="h-4 w-4 mr-2" />
            Table
          </button>
          
          <button
            // If they click register without a table, send to a generic 'walk-in' or back to floor
            onClick={() => {
              if (location.pathname.includes('/pos/order')) return; // Already there
              // Mock generic order screen or enforce floor selection
              alert('Please select a table from the Floor view first');
            }}
            className={`h-full px-2 flex items-center font-medium text-sm transition-colors ${isActive('/pos/register') ? activeTabClasses : inactiveTabClasses}`}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Register
          </button>

          <button
            // Ongoing order list view (not strictly built, mapping to floor plan for now as floor plan shows 'orders' per table or just a dummy endpoint)
            onClick={() => navigate('/pos/floor')} 
            className={`h-full px-2 flex items-center font-medium text-sm transition-colors ${isActive('/pos/orders') ? activeTabClasses : inactiveTabClasses}`}
          >
            <ListOrdered className="h-4 w-4 mr-2" />
            Orders
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          <span className="text-xs text-gray-500">{activeSession?.terminal_name ?? activeSession?.terminal?.name ?? 'POS'}</span>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center text-gray-600"
          >
            <Monitor className="h-5 w-5 mr-1" />
            <ChevronDown className="h-4 w-4" />
          </Button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
               <button
                  onClick={() => { setShowDropdown(false); navigate('/backend/terminals'); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
               >
                 <Settings className="h-4 w-4 mr-2" />
                 Settings
               </button>
               {/* Dummy Cash in/out for UI requirement */}
               <button
                  onClick={() => { setShowDropdown(false); alert('Cash In/Out functionality coming soon!'); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
               >
                 <ShoppingCart className="h-4 w-4 mr-2" />
                 Cash In/Out
               </button>
               <hr className="my-1 border-gray-200" />
               <button
                  onClick={handleCloseSession}
                  disabled={closingSession}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
               >
                 <LogOut className="h-4 w-4 mr-2" />
                 Close Register
               </button>
               <button
                  onClick={() => { setShowDropdown(false); logout(); navigate('/login'); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
               >
                 <LogOut className="h-4 w-4 mr-2" />
                 Logout User
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSHeader;
