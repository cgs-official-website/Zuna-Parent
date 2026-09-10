import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleNotificationClick = (notif) => {
    if (notif.unread) {
      markAsRead(notif.id);
    }
    if (onClose) onClose();
    if (notif.path) {
      navigate(notif.path);
    }
  };

  const renderIcon = (iconName, size = 16) => {
    const IconComponent = Icons[iconName] || Icons.Bell;
    return <IconComponent size={size} />;
  };

  return (
    <div 
      className="navbar-dropdown-panel notif-dropdown-panel"
      style={{
        position: 'absolute',
        top: 'calc(100% + 0.65rem)',
        right: 0,
        width: '350px',
        background: 'var(--admin-card-bg)',
        border: '1px solid var(--admin-border)',
        borderRadius: '14px',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
        zIndex: 250,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        className="dropdown-header"
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--admin-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--theme-toggle-bg, rgba(255, 255, 255, 0.03))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-text-main)' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.15rem 0.5rem', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700 }}>
              {unreadCount} Unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications Items List */}
      <div className="notif-list" style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.84rem' }}>
            <Icons.RotateCw size={18} className="spin-icon" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--accent)' }} />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <Icons.BellOff size={28} style={{ opacity: 0.4, margin: '0 auto 0.5rem', display: 'block' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: 'var(--admin-text-main)' }}>No notifications yet</span>
            <small style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>You're all caught up with your SaaS events.</small>
          </div>
        ) : notifications.map(n => (
            <div 
              key={n.id} 
              className={`notif-item ${n.unread ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(n)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--admin-border)',
                background: n.unread ? 'rgba(0, 132, 255, 0.08)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
            >
              <div 
                className="notif-icon-box"
                style={{ 
                  padding: '0.45rem', 
                  borderRadius: '10px', 
                  background: n.unread ? 'rgba(0, 132, 255, 0.15)' : 'var(--theme-toggle-bg, rgba(255,255,255,0.05))', 
                  color: n.unread ? 'var(--accent)' : 'var(--admin-text-muted)', 
                  flexShrink: 0 
                }}
              >
                {renderIcon(n.icon, 16)}
              </div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--admin-text-main)', fontWeight: n.unread ? 700 : 600 }}>{n.title}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{n.time || 'Just now'}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.text}</div>
              </div>
              {n.unread && (
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0084FF', marginTop: '0.35rem', flexShrink: 0 }} />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
