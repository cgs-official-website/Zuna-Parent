import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import LandingPage from './components/public/LandingPage';
import LoginForm from './components/admin/LoginForm';
import DashboardLayout from './components/admin/DashboardLayout';
import DashboardOverview from './components/admin/DashboardOverview';
import ProductsTable from './components/admin/ProductsTable';
import TicketsTable from './components/admin/TicketsTable';
import DemoRequestsTable from './components/admin/DemoRequestsTable';
import Analytics from './components/admin/Analytics';
import TeamManager from './components/admin/TeamManager';
import BillingManager from './components/admin/BillingManager';
import Settings from './components/admin/Settings';
import HelpSupport from './components/admin/HelpSupport';
import AdminRoute from './routes/AdminRoute';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />

      {/* Admin Login */}
      <Route path="/admin" element={<LoginForm isAuthenticated={isAuthenticated} />} />
      <Route path="/admin/login" element={<Navigate to="/admin" replace />} />

      {/* Protected Admin Dashboard */}
      <Route path="/admin/dashboard" element={<AdminRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<DashboardOverview />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="products" element={<ProductsTable />} />
          <Route path="tickets" element={<TicketsTable />} />
          <Route path="demo-requests" element={<DemoRequestsTable />} />
          <Route path="team" element={<TeamManager />} />
          <Route path="billing" element={<BillingManager />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help-support" element={<HelpSupport />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
