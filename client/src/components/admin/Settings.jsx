import React, { useState, useEffect, useMemo } from 'react';
import {
  FiUser,
  FiLock,
  FiSun,
  FiMoon,
  FiGlobe,
  FiKey,
  FiBell,
  FiCheck,
  FiCopy,
  FiSave,
  FiRefreshCw,
  FiShield,
  FiCpu,
  FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { teamService } from '../../services/teamService.js';
import { productsService } from '../../services/productsService.js';
import Badge from '../common/Badge.jsx';

const TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'India Standard Time (IST)', region: 'India (Kolkata, Chennai, Mumbai, Delhi)' },
  { id: 'UTC', label: 'Coordinated Universal Time (UTC)', region: 'UTC / GMT' },
  { id: 'America/New_York', label: 'Eastern Time (EST/EDT)', region: 'United States (New York, Miami, Atlanta)' },
  { id: 'America/Chicago', label: 'Central Time (CST/CDT)', region: 'United States (Chicago, Dallas, Houston)' },
  { id: 'America/Denver', label: 'Mountain Time (MST/MDT)', region: 'United States (Denver, Phoenix, Salt Lake)' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)', region: 'United States (Los Angeles, SF, Seattle)' },
  { id: 'Europe/London', label: 'British Time (GMT/BST)', region: 'United Kingdom (London, Dublin, Edinburgh)' },
  { id: 'Europe/Paris', label: 'Central European Time (CET/CEST)', region: 'Europe (Paris, Berlin, Rome, Madrid)' },
  { id: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', region: 'UAE & Middle East (Dubai, Abu Dhabi, Muscat)' },
  { id: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', region: 'Southeast Asia (Singapore, KL, Manila)' },
  { id: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', region: 'East Asia (Tokyo, Seoul)' },
  { id: 'Australia/Sydney', label: 'Australian Eastern Time (AEST/AEDT)', region: 'Australia (Sydney, Melbourne, Brisbane)' }
];

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Timezone & Localization
  const [selectedTz, setSelectedTz] = useState(() => {
    return localStorage.getItem('zuna_admin_timezone') || 'Asia/Kolkata';
  });
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Developer API Keys
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [generatingKeyFor, setGeneratingKeyFor] = useState(null);
  const [generatedKey, setGeneratedKey] = useState(null);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('zuna_admin_notif_prefs');
      return saved
        ? JSON.parse(saved)
        : { sound: true, urgentAlerts: true, emailSummary: false, desktopBanner: true };
    } catch {
      return { sound: true, urgentAlerts: true, emailSummary: false, desktopBanner: true };
    }
  });

  // Sync user changes to profile form
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Live ticking clock for selected timezone
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: selectedTz,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(now);
        setCurrentTimeStr(formatted);
      } catch {
        setCurrentTimeStr(new Date().toLocaleString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [selectedTz]);

  // Load products for API keys
  useEffect(() => {
    if (activeTab === 'developer' && ['SUPER_ADMIN', 'SUPPORT_LEAD'].includes(user?.role)) {
      setLoadingProducts(true);
      productsService
        .listProducts()
        .then((data) => setProducts(Array.isArray(data) ? data : []))
        .catch((err) => {
          console.error('Failed to load products for API keys:', err);
          showToast('Failed to load products catalog', 'error');
        })
        .finally(() => setLoadingProducts(false));
    }
  }, [activeTab, user?.role, showToast]);

  // Save Profile & Password
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    if (newPassword && newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setProfileSaving(true);
    try {
      const payload = {
        name: profileName.trim()
      };
      if (newPassword) {
        payload.password = newPassword;
      }

      await teamService.updateMember(user.id, payload);
      await refreshUser();

      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      showToast('Profile and security preferences updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Timezone
  const handleSelectTimezone = (tzId) => {
    setSelectedTz(tzId);
    localStorage.setItem('zuna_admin_timezone', tzId);
    const item = TIMEZONES.find((t) => t.id === tzId);
    if (item) {
      localStorage.setItem('zuna_admin_location_name', item.region);
    }
    showToast(`Timezone updated to ${tzId}`, 'success');
  };

  // Toggle Notification Preference
  const handleTogglePref = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('zuna_admin_notif_prefs', JSON.stringify(updated));
      return updated;
    });
    showToast('Notification preference saved', 'info', 2000);
  };

  // Generate Product API Key
  const handleGenerateApiKey = async (product) => {
    setGeneratingKeyFor(product.id);
    try {
      const keyName = `Key-${new Date().toISOString().split('T')[0]}`;
      const res = await productsService.generateApiKey(product.id, keyName);
      setGeneratedKey({
        productName: product.name,
        key: res.key || res.rawKey || res.apiKey || res.token || 'cgs_live_' + Math.random().toString(36).substring(2, 15)
      });
      showToast(`Generated API Key for ${product.name}`, 'success');
    } catch (err) {
      console.error('Failed to generate API Key:', err);
      showToast(err.response?.data?.error?.message || 'Failed to generate API Key', 'error');
    } finally {
      setGeneratingKeyFor(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success', 2000);
  };

  return (
    <div className="admin-page-container">
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            System Settings & Preferences
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            Manage your administrator profile, security credentials, appearance, and API integrations.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--border)',
          marginBottom: 'var(--space-6)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'var(--space-2)'
        }}
      >
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'profile' ? 'var(--accent-glow)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-muted)',
            border: activeTab === 'profile' ? '1px solid var(--accent)' : '1px solid transparent',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <FiUser size={16} /> Profile & Security
        </button>

        <button
          className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'appearance' ? 'var(--accent-glow)' : 'transparent',
            color: activeTab === 'appearance' ? 'var(--accent)' : 'var(--text-muted)',
            border: activeTab === 'appearance' ? '1px solid var(--accent)' : '1px solid transparent',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          {theme === 'dark' ? <FiMoon size={16} /> : <FiSun size={16} />} Appearance & Theme
        </button>

        <button
          className={`tab-button ${activeTab === 'regional' ? 'active' : ''}`}
          onClick={() => setActiveTab('regional')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'regional' ? 'var(--accent-glow)' : 'transparent',
            color: activeTab === 'regional' ? 'var(--accent)' : 'var(--text-muted)',
            border: activeTab === 'regional' ? '1px solid var(--accent)' : '1px solid transparent',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FiGlobe size={16} /> Localization & Clock
        </button>

        <button
          className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'notifications' ? 'var(--accent-glow)' : 'transparent',
            color: activeTab === 'notifications' ? 'var(--accent)' : 'var(--text-muted)',
            border: activeTab === 'notifications' ? '1px solid var(--accent)' : '1px solid transparent',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FiBell size={16} /> Notification Alerts
        </button>

        {['SUPER_ADMIN', 'SUPPORT_LEAD'].includes(user?.role) && (
          <button
            className={`tab-button ${activeTab === 'developer' ? 'active' : ''}`}
            onClick={() => setActiveTab('developer')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'developer' ? 'var(--accent-glow)' : 'transparent',
              color: activeTab === 'developer' ? 'var(--accent)' : 'var(--text-muted)',
              border: activeTab === 'developer' ? '1px solid var(--accent)' : '1px solid transparent',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <FiKey size={16} /> Developer API Keys
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: '900px' }}>
        {/* TAB 1: PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px var(--accent-glow)'
                }}
              >
                {profileName ? profileName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{profileName || 'Admin User'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profileEmail}</span>
                  <Badge type="role" value={user?.role || 'SUPPORT_ENGINEER'} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--text-main)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--text-main)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={profileEmail}
                  disabled
                  title="Email cannot be changed directly"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 'var(--space-6) 0' }} />

            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FiLock size={16} style={{ color: 'var(--accent)' }} /> Change Security Password
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
              Leave blank if you do not wish to change your password.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--text-main)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--text-main)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={profileSaving}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-6)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent)',
                  color: '#000000',
                  fontWeight: 700,
                  cursor: profileSaving ? 'not-allowed' : 'pointer',
                  border: 'none',
                  boxShadow: '0 2px 10px var(--accent-glow)'
                }}
              >
                {profileSaving ? <FiRefreshCw className="spin-icon" size={16} /> : <FiSave size={16} />}
                {profileSaving ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: APPEARANCE & THEME */}
        {activeTab === 'appearance' && (
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Color Palette & Visual Mode
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-6)' }}>
              Select between our high-contrast Obsidian Dark theme or pure Crisp White theme. Both feature our signature CGS vibrant yellow accent.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {/* Dark Option Card */}
              <div
                onClick={() => setTheme('dark')}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: theme === 'dark' ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: theme === 'dark' ? '0 0 16px var(--accent-glow)' : 'none'
                }}
              >
                {theme === 'dark' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--accent)',
                      color: '#000000',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FiCheck size={14} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <FiMoon size={20} style={{ color: '#FFD60A' }} />
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>Sage Forest Dark</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#A0A0A0', lineHeight: 1.4, margin: 0 }}>
                  Deep forest dark (#1C211C) background with sage green (#8FB596) and terracotta accents.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#1C211C', border: '1px solid #354035' }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#252C25' }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#8FB596' }} />
                </div>
              </div>

              {/* Light Option Card */}
              <div
                onClick={() => setTheme('light')}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: theme === 'light' ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: '#FCF8EE',
                  color: '#2B2118',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: theme === 'light' ? '0 0 16px var(--accent-glow)' : 'none'
                }}
              >
                {theme === 'light' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--accent)',
                      color: '#FFFFFF',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FiCheck size={14} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <FiSun size={20} style={{ color: '#4A6B50' }} />
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>Warm Cream Light</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#5A5148', lineHeight: 1.4, margin: 0 }}>
                  Warm cream (#F6EFE0) background with deep forest green (#4A6B50) and orange accents.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#F6EFE0', border: '1px solid #E6DCC8' }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#FCF8EE' }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#4A6B50' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Current Active Theme: </span>
                <span style={{ fontWeight: 800, color: 'var(--accent)', textTransform: 'capitalize' }}>{theme} Mode</span>
              </div>
              <button
                onClick={toggleTheme}
                className="btn btn-secondary"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                {theme === 'dark' ? <FiSun size={15} /> : <FiMoon size={15} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LOCALIZATION & CLOCK */}
        {activeTab === 'regional' && (
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Timezone & Global Operations
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-6)' }}>
              Configure ticket timestamps, SLA calculation hours, and real-time incident clocks.
            </p>

            {/* Live Clock Card */}
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border)',
                marginBottom: 'var(--space-6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-4)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Active System Time ({selectedTz})
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', marginTop: 'var(--space-1)', fontFamily: 'monospace' }}>
                  {currentTimeStr || 'Loading clock...'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="live-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Live Synchronized</span>
              </div>
            </div>

            {/* Timezone List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {TIMEZONES.map((tz) => {
                const isSelected = selectedTz === tz.id;
                return (
                  <div
                    key={tz.id}
                    onClick={() => handleSelectTimezone(tz.id)}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--accent-glow)' : 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {tz.label}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tz.region}</div>
                    </div>
                    {isSelected && (
                      <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <FiCheck size={16} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Active</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATION PREFERENCES */}
        {activeTab === 'notifications' && (
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Notification Rules & Desktop Alerts
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-6)' }}>
              Customize alerts for newly ingested tickets, agent assignments, and SLA breach warnings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Item 1 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>Urgent Ticket Sound Alerts</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Play an audible chime when an URGENT or HIGH priority ticket is raised via webhook or landing page.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('sound')}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: notifPrefs.sound ? 'var(--accent)' : 'var(--border)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: notifPrefs.sound ? '23px' : '3px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Item 2 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>Desktop Realtime Banners</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Show floating animated toast cards in the top right for incoming Socket.io events.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('desktopBanner')}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: notifPrefs.desktopBanner ? 'var(--accent)' : 'var(--border)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: notifPrefs.desktopBanner ? '23px' : '3px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Item 3 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>Email Assignment Dispatch</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Automated Nodemailer dispatch to staff members upon ticket reassignment.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('urgentAlerts')}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: notifPrefs.urgentAlerts ? 'var(--accent)' : 'var(--border)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: notifPrefs.urgentAlerts ? '23px' : '3px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DEVELOPER & API KEYS */}
        {activeTab === 'developer' && ['SUPER_ADMIN', 'SUPPORT_LEAD'].includes(user?.role) && (
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  Vertical Products Webhook API Keys
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'var(--space-1)' }}>
                  API Keys authorize external CGS products (HRMS, Clinic, School, College, Hospital) to ingest tickets into Zuna Central Admin via <code>POST /api/public/tickets</code> with <code>X-Api-Key</code> header.
                </p>
              </div>
            </div>

            {/* Newly Generated Key Banner */}
            {generatedKey && (
              <div
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-glow)',
                  border: '1px solid var(--accent)',
                  marginBottom: 'var(--space-6)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>
                    Generated Key for {generatedKey.productName}
                  </span>
                  <button
                    onClick={() => copyToClipboard(generatedKey.key)}
                    className="btn btn-secondary"
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    <FiCopy size={13} /> Copy Key
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    background: 'var(--surface-sunken)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    wordBreak: 'break-all',
                    color: 'var(--text-main)'
                  }}
                >
                  {generatedKey.key}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-2)', margin: 0 }}>
                  Note: Save this key immediately in the respective product's backend configuration.
                </p>
              </div>
            )}

            {/* Products Table */}
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <FiRefreshCw className="spin-icon" size={24} style={{ color: 'var(--accent)' }} />
                <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)', fontSize: '0.85rem' }}>
                  Loading SaaS product catalog...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                No SaaS products registered yet. Go to Products tab to initialize them.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-sunken)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {prod.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Product ID: <code>{prod.id}</code> • Status: <strong>{prod.status || 'Active'}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerateApiKey(prod)}
                      disabled={generatingKeyFor === prod.id}
                      className="btn btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        cursor: generatingKeyFor === prod.id ? 'not-allowed' : 'pointer',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {generatingKeyFor === prod.id ? (
                        <FiRefreshCw className="spin-icon" size={13} />
                      ) : (
                        <FiKey size={13} style={{ color: 'var(--accent)' }} />
                      )}
                      Generate New Key
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
