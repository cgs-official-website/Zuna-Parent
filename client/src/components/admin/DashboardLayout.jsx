import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import NotificationDropdown from './NotificationDropdown';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext';

const DashboardLayoutContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const [refreshKey, setRefreshKey] = useState(0);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('zuna_admin_theme') || 'dark';
  });

  const [currentTime, setCurrentTime] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);

  const searchResults = [
    { type: 'Product', name: 'HRMS SaaS Portal', path: '/admin/dashboard/products' },
    { type: 'Product', name: 'Restaurant POS System', path: '/admin/dashboard/products' },
    { type: 'Product', name: 'College Management System', path: '/admin/dashboard/products' },
    { type: 'Ticket', name: 'TK-842: Payroll Tax Export Issue', path: '/admin/dashboard/tickets' },
    { type: 'Ticket', name: 'TK-843: KDS Thermal Printer', path: '/admin/dashboard/tickets' }
  ].filter(item => item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()));

  // Section-based Sidebar Menu Configuration with direct React Router paths
  const sidebarSections = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard Overview', icon: 'LayoutDashboard', path: '/admin/dashboard/overview', key: '/overview' },
        { label: 'Analytics / Reports', icon: 'BarChart2', path: '/admin/dashboard/analytics', key: '/analytics' }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Product Manager', icon: 'Layers', path: '/admin/dashboard/products', key: '/products' },
        { label: 'Ticket Monitor', icon: 'LifeBuoy', path: '/admin/dashboard/tickets', key: '/tickets' },
        { label: 'Demo Requests', icon: 'Calendar', path: '/admin/dashboard/demo-requests', key: '/demo-requests' },
        { label: 'Team / Users', icon: 'Users', path: '/admin/dashboard/team', key: '/team' },
        { label: 'Billing & Subscriptions', icon: 'CreditCard', path: '/admin/dashboard/billing', key: '/billing' }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Settings', icon: 'Settings', path: '/admin/dashboard/settings', key: '/settings' },
        { label: 'Help & Support', icon: 'HelpCircle', path: '/admin/dashboard/help-support', key: '/help-support' }
      ]
    }
  ];

  useEffect(() => {
    localStorage.setItem('zuna_admin_theme', theme);
  }, [theme]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live ticking digital clock with timezone & settings listener
  useEffect(() => {
    const updateClock = () => {
      const selectedTz = localStorage.getItem('zuna_admin_timezone');
      const now = new Date();
      try {
        const options = selectedTz ? { timeZone: selectedTz } : {};
        const dateStr = now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          ...options
        });
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          ...options
        });

        setCurrentTime(`${dateStr} • ${timeStr}`);
      } catch (err) {
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        setCurrentTime(`${dateStr} • ${timeStr}`);
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    const handleSettingsUpdated = () => {
      const updatedTheme = localStorage.getItem('zuna_admin_theme') || 'dark';
      setTheme(updatedTheme);
      updateClock();
    };

    window.addEventListener('zuna_settings_updated', handleSettingsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('zuna_settings_updated', handleSettingsUpdated);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const renderIcon = (iconName, size = 18) => {
    const IconComponent = Icons[iconName] || Icons.Layers;
    return <IconComponent size={size} />;
  };

  const getPageTitle = () => {
    if (location.pathname.includes('/analytics')) return 'Analytics & Reports';
    if (location.pathname.includes('/products')) return 'Product Manager';
    if (location.pathname.includes('/tickets')) return 'Support Ticket Monitor';
    if (location.pathname.includes('/settings')) return 'System Settings';
    if (location.pathname.includes('/help-support')) return 'Help & Support Desk';
    if (location.pathname.includes('/team')) return 'Team & User Management';
    if (location.pathname.includes('/billing')) return 'Billing & Subscriptions';
    return 'Dashboard Overview';
  };

  // Framer Motion Animation Variants
  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -18 },
    show: { 
      opacity: 1, 
      x: 0, 
      transition: { type: "spring", stiffness: 380, damping: 26 } 
    }
  };

  return (
    <div className="admin-dashboard-container" data-theme={theme}>
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <img src="/Zuna_HRMS_Logo_Navy.png" alt="Zuna" style={{ height: '28px' }} />
            <div className="sidebar-logo-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span className="sidebar-brand-name" style={{ fontSize: '1.15rem', fontWeight: 800 }}>Zuna Admin</span>
              <span className="sidebar-subtitle" style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--admin-text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                Carrezza Global Solutions
              </span>
            </div>
          </Link>
          <button 
            className="mobile-close-btn" 
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Icons.X size={18} />
          </button>
        </div>
        
        <div className="sidebar-menu-wrapper">
          {sidebarSections.map((section, sIdx) => (
            <div key={section.title} className="sidebar-section">
              <motion.div 
                className="sidebar-section-label"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {section.title}
              </motion.div>
              
              <motion.ul 
                className="sidebar-menu-list"
                variants={listContainerVariants}
                initial="hidden"
                animate="show"
              >
                {section.items.map((item) => {
                  const isActive = 
                    item.key === '/overview' 
                      ? (location.pathname.includes('/overview') || location.pathname === '/admin/dashboard')
                      : location.pathname.includes(item.key);

                  return (
                    <motion.li 
                      key={item.label} 
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, x: 3 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      style={{ position: 'relative' }}
                    >
                      <Link 
                        to={item.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                        style={{ position: 'relative', zIndex: 2 }}
                      >
                        {/* Morphing Elastic Spring Shared Pill (layoutId="activePill") */}
                        {isActive && (
                          <motion.div 
                            className="active-pill-background"
                            layoutId="activePill"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}

                        {/* Elastic Icon Scale Bounce on Active */}
                        <motion.div 
                          className="sidebar-icon-wrapper"
                          animate={isActive ? { scale: [0.8, 1.15, 1] } : { scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        >
                          {renderIcon(item.icon, 18)}
                        </motion.div>

                        <span style={{ position: 'relative', zIndex: 3 }}>{item.label}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
              {sIdx < sidebarSections.length - 1 && <div className="sidebar-section-divider" />}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="btn-logout btn-interactive" onClick={handleLogout}>
            {renderIcon('LogOut', 18)}
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header" style={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 1, minWidth: 0 }}>
            <button 
              className="mobile-hamburger-btn" 
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Icons.Menu size={20} />
            </button>
            <div className="admin-header-title">
              {getPageTitle()}
            </div>
          </div>

          <div className="navbar-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0, minWidth: 0 }}>
            {/* Flexible Search Bar */}
            <div className="navbar-search-wrapper" ref={searchRef} style={{ position: 'relative', flex: '1 1 auto', maxWidth: '240px', minWidth: '110px' }}>
              <Icons.Search size={15} className="navbar-search-icon" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', pointerEvents: 'none' }} />
              <input 
                type="text" 
                placeholder="Search products, tickets..." 
                className="navbar-search-input"
                value={globalSearchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                style={{
                  height: '36px',
                  paddingLeft: '2.2rem',
                  paddingRight: '0.75rem',
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  border: '1px solid var(--admin-border)',
                  background: 'var(--admin-input-bg)',
                  color: 'var(--admin-text-main)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              {searchOpen && globalSearchQuery.trim() !== '' && (
                <div className="navbar-dropdown-panel search-results-panel">
                  <div className="dropdown-header">Search Results</div>
                  {searchResults.length > 0 ? (
                    searchResults.map((res, i) => (
                      <Link 
                        key={i} 
                        to={res.path} 
                        className="dropdown-item"
                        onClick={() => {
                          setSearchOpen(false);
                          setGlobalSearchQuery('');
                        }}
                      >
                        <span className="search-tag">{res.type}</span>
                        <span>{res.name}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="dropdown-empty">No results matching "{globalSearchQuery}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Glowing Digital Clock Display (Hidden on screens < 960px) */}
            <div className="admin-header-clock navbar-clock-desktop" title="Current digital time">
              <Icons.Clock size={14} style={{ color: 'var(--accent)' }} />
              <span className="digital-clock-text">{currentTime || 'Loading date & time...'}</span>
            </div>

            {/* Notifications Bell with Dynamic Red Badge */}
            <div className="navbar-dropdown-wrapper" ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button 
                className="navbar-icon-btn" 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notifications"
                aria-label="View notifications"
                style={{ 
                  height: '36px', 
                  width: '36px', 
                  borderRadius: '50%', 
                  border: '1px solid var(--admin-border)',
                  background: 'var(--theme-toggle-bg, rgba(255, 255, 255, 0.08))',
                  color: 'var(--admin-text-main)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <Icons.Bell size={18} />
                {unreadCount > 0 && (
                  <span 
                    className="notif-badge"
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel (Anchored top-right below bell) */}
              {notificationsOpen && (
                <NotificationDropdown onClose={() => setNotificationsOpen(false)} />
              )}
            </div>

            {/* Light / Dark Mode Toggle (Icon Only - Sun/Moon) */}
            <button 
              className={`admin-theme-toggle-btn ${theme}`}
              onClick={toggleTheme} 
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle dark mode"
              style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                minHeight: '36px',
                borderRadius: '50%',
                border: '1px solid var(--admin-border)',
                background: 'var(--theme-toggle-bg, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, scale: 0.75, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, type: 'spring', stiffness: 350, damping: 22 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
c              >
                {theme === 'dark' ? (
                  <Icons.Moon size={18} style={{ color: '#fbbf24' }} />
                ) : (
                  <Icons.Sun size={18} style={{ color: '#f59e0b' }} />
                )}
              </motion.div>
            </button>

            {/* User Profile Dropdown - ALWAYS VISIBLE, NEVER CUT OFF */}
            <div className="navbar-dropdown-wrapper" ref={userRef} style={{ flexShrink: 0 }}>
              <div 
                className="admin-user" 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}
              >
                <div className="admin-user-info navbar-user-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <span className="admin-username" style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', lineHeight: '1.2', whiteSpace: 'nowrap', color: 'var(--admin-text-main)' }}>Admin User</span>
                  <span className="admin-role" style={{ display: 'block', fontSize: '0.72rem', lineHeight: '1.2', whiteSpace: 'nowrap', color: 'var(--admin-text-muted)', fontWeight: 500 }}>System Administrator</span>
                </div>
                <div className="admin-avatar" style={{ flexShrink: 0, width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', borderRadius: '50%', background: 'var(--accent-gradient, linear-gradient(135deg, #0084FF 0%, #00F5D4 100%))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>A</div>
              </div>

              {userDropdownOpen && (
                <div className="navbar-dropdown-panel user-dropdown-panel">
                  <div className="user-dropdown-header">
                    <strong>Admin Administrator</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>admin@zuna.com</div>
                  </div>
                  <div className="user-dropdown-menu">
                    <Link to="/admin/dashboard/overview" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                      <Icons.LayoutDashboard size={15} /> Dashboard Summary
                    </Link>
                    <Link to="/admin/dashboard/products" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                      <Icons.Layers size={15} /> SaaS Products Manager
                    </Link>
                    <Link to="/admin/dashboard/tickets" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                      <Icons.LifeBuoy size={15} /> Support Desk Tickets
                    </Link>
                    <Link to="/admin/dashboard/settings" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                      <Icons.Settings size={15} /> System Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <Icons.LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="admin-content" style={{ padding: '1.5rem 2rem', width: '100%', boxSizing: 'border-box' }}>
          <Outlet key={location.pathname + refreshKey} />
        </div>
      </main>
    </div>
  );
};

const DashboardLayout = () => (
  <NotificationProvider>
    <DashboardLayoutContent />
  </NotificationProvider>
);

export default DashboardLayout;
