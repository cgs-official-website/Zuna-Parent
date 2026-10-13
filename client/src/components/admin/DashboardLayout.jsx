import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiInbox,
  FiLayers,
  FiCalendar,
  FiUsers,
  FiCreditCard,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiShield
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import { RoleBadge } from '../common/Badge.jsx';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard/overview', icon: FiGrid },
    { label: 'Tickets', path: '/admin/dashboard/tickets', icon: FiInbox },
    { label: 'Products', path: '/admin/dashboard/products', icon: FiLayers },
    { label: 'Demo Leads', path: '/admin/dashboard/demo-requests', icon: FiCalendar },
    { label: 'Team', path: '/admin/dashboard/team', icon: FiUsers },
    { label: 'Billing', path: '/admin/dashboard/billing', icon: FiCreditCard },
    { label: 'Analytics', path: '/admin/dashboard/analytics', icon: FiBarChart2 },
    { label: 'Settings', path: '/admin/dashboard/settings', icon: FiSettings }
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9940
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop Collapsible & Mobile Slide-over Drawer) */}
      <aside
        className={`glass-panel ${isMobileOpen ? 'mobile-drawer-open' : ''}`}
        style={{
          width: isCollapsed ? '72px' : '240px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9945,
          borderRadius: 0,
          borderRight: '1px solid var(--border)',
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          transition: 'width var(--transition-normal)',
          flexShrink: 0
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0' : '0 var(--space-5)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <div
            onClick={() => navigate('/admin/dashboard/overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <img
              src="/logo.png"
              alt="Zuna Logo"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            {!isCollapsed && (
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text)'
                }}
              >
                Zuna
              </span>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse sidebar"
              className="btn-ghost hide-on-mobile"
              style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
            >
              <FiChevronLeft size={18} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <button
              onClick={() => setIsCollapsed(false)}
              aria-label="Expand sidebar"
              className="btn-ghost hide-on-mobile"
              style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: 'var(--space-3) var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto'
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isCollapsed ? '10px 0' : '10px 14px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={18} color={isActive ? 'var(--accent-contrast)' : 'currentColor'} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer User Info Profile Card */}
        <div
          style={{
            padding: isCollapsed ? '12px 8px' : 'var(--space-3)',
            borderTop: '1px solid var(--border)',
            background: 'rgba(0, 0, 0, 0.02)'
          }}
        >
          {isCollapsed ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent) 0%, #E6AF00 100%)',
                  color: '#0A0A0A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  boxShadow: '0 2px 8px var(--accent-glow)'
                }}
                title={`${user?.name || 'Admin'} (${user?.role || 'Administrator'})`}
              >
                {(user?.name || 'A').charAt(0).toUpperCase()}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    right: '-1px',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: '#10B981',
                    border: '2px solid var(--surface)'
                  }}
                />
              </div>

              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  transition: 'var(--transition-fast)',
                  cursor: 'pointer',
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--danger)';
                  e.currentTarget.style.background = 'var(--danger-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <FiLogOut size={16} />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                {/* User Avatar with Status Indicator */}
                <div
                  style={{
                    position: 'relative',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #E6AF00 100%)',
                    color: '#0A0A0A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    boxShadow: '0 2px 8px var(--accent-glow)',
                    flexShrink: 0
                  }}
                >
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-1px',
                      right: '-1px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#10B981',
                      border: '2px solid var(--surface-2)'
                    }}
                    title="Online"
                  />
                </div>

                {/* Name & Role */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.2
                    }}
                    title={user?.name || 'Admin'}
                  >
                    {user?.name || 'Admin'}
                  </div>
                  <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center' }}>
                    {user?.role ? (
                      <RoleBadge role={user.role} />
                    ) : (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: 'var(--accent)',
                          background: 'var(--accent-light)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        Administrator
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  transition: 'var(--transition-fast)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--danger)';
                  e.currentTarget.style.background = 'var(--danger-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <FiLogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Navbar */}
        <header
          className="glass-panel"
          style={{
            height: '64px',
            position: 'sticky',
            top: 0,
            zIndex: 9930,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-4)',
            borderRadius: 0,
            borderBottom: '1px solid var(--border)',
            borderTop: 'none',
            borderRight: 'none',
            borderLeft: 'none'
          }}
        >
          {/* Left: Mobile Toggle & Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setIsMobileOpen((prev) => !prev)}
              aria-label="Toggle mobile navigation"
              className="btn-ghost show-on-mobile"
              style={{ padding: '8px' }}
            >
              {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>

            {/* Realtime Connection Status Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: isConnected ? 'var(--success-bg)' : 'var(--surface-2)',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'var(--border)'}`,
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: isConnected ? 'var(--success)' : 'var(--text-secondary)'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isConnected ? 'var(--success)' : 'var(--text-muted)'
                }}
                className={isConnected ? 'badge-pulse' : ''}
              />
              <span>{isConnected ? 'LIVE SYNC' : 'SYSTEM READY'}</span>
            </div>
          </div>

          {/* Right: Theme Switcher, Notifications, User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Animated Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {isDark ? (
                <FiSun size={18} color="var(--accent)" />
              ) : (
                <FiMoon size={18} color="var(--text)" />
              )}
            </button>

            {/* Notification Dropdown */}
            <NotificationDropdown />
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* Responsive Media Query Styles */}
      <style>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: flex !important; }
          aside {
            position: fixed !important;
            left: -280px;
            top: 0;
            width: 260px !important;
            transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          aside.mobile-drawer-open {
            left: 0 !important;
          }
        }
        @media (min-width: 769px) {
          .show-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
