import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';

const AdminRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
          gap: '16px'
        }}
      >
        <div style={{ width: '48px', height: '48px', position: 'relative' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
        <Skeleton width="180px" height="18px" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  const userRole = (user?.role || user?.admin?.role || role || '').toUpperCase();
  const isSuper = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || user?.email === 'admin@zuna.com';

  if (allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(userRole) || (allowedRoles.includes('SUPER_ADMIN') && isSuper);
    if (!isAllowed) {
      return <Navigate to="/admin/dashboard/overview" replace />;
    }
  }

  return <Outlet />;
};

export default AdminRoute;
