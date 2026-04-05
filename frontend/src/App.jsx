import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicLayout from '@/layouts/PublicLayout';
import AppLayout from '@/layouts/AppLayout';

// Auth pages
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';

// Backend pages
import Dashboard from '@/pages/backend/Dashboard';
import Products from '@/pages/backend/Products';
import Categories from '@/pages/backend/Categories';
import Attributes from '@/pages/backend/Attributes';
import PaymentMethods from '@/pages/backend/PaymentMethods';
import Floors from '@/pages/backend/Floors';
import Tables from '@/pages/backend/Tables';
import Terminals from '@/pages/backend/Terminals';
import Payments from '@/pages/backend/AdminPayments';
import Customers from '@/pages/backend/Customers';
import AdminOrders from '@/pages/backend/AdminOrders';
import Reports from '@/pages/backend/Reports';

// POS pages
import OpenSession from '@/pages/pos/OpenSession';
import FloorView from '@/pages/pos/FloorView';
import OrderScreen from '@/pages/pos/OrderScreen';
import PaymentScreen from '@/pages/pos/PaymentScreen';

// Other pages
import KitchenDisplay from '@/pages/kitchen/KitchenDisplay';
import CustomerDisplay from '@/pages/CustomerDisplay';
import SelfOrder from '@/pages/selforder/SelfOrder';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#16A34A',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#DC2626',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          } />
          <Route path="/signup" element={
            <PublicLayout>
              <Signup />
            </PublicLayout>
          } />

          {/* Protected backend routes */}
          <Route path="/backend/*" element={
            <ProtectedRoute roles={['admin']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="attributes" element={<Attributes />} />
            <Route path="payment-methods" element={<PaymentMethods />} />
            <Route path="floors" element={<Floors />} />
            <Route path="tables" element={<Tables />} />
            <Route path="terminals" element={<Terminals />} />
            <Route path="reports" element={<Reports />} />
            <Route path="customers" element={<Customers />} />
            <Route path="admin-orders" element={<AdminOrders />} />
            <Route path="admin-payments" element={<Payments />} />
          </Route>

          {/* POS routes */}
          <Route path="/pos/open-session" element={
            <ProtectedRoute>
              <OpenSession />
            </ProtectedRoute>
          } />
          <Route path="/pos/floor" element={
            <ProtectedRoute>
              <FloorView />
            </ProtectedRoute>
          } />
          <Route path="/pos/order/:tableId" element={
            <ProtectedRoute>
              <OrderScreen />
            </ProtectedRoute>
          } />
          <Route path="/pos/payment/:orderId" element={
            <ProtectedRoute>
              <PaymentScreen />
            </ProtectedRoute>
          } />

          {/* Public utility routes */}
          <Route path="/kitchen" element={<KitchenDisplay />} />
          <Route path="/customer-display" element={<CustomerDisplay />} />
          <Route path="/self-order" element={<SelfOrder />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
