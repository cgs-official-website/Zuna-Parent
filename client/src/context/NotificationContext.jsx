import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services/notificationsService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications in context:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Setup real-time listener if available
    const unsubscribe = notificationsService.subscribeNotifications((updatedList) => {
      setNotifications(updatedList);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = useCallback(async (id) => {
    // Optimistic update: immediately decrement unread count in local React state
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));

    try {
      const persisted = await notificationsService.markAsRead(id);
      setNotifications(persisted);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update: immediately set all to read (unreadCount becomes 0)
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

    try {
      const persisted = await notificationsService.markAllAsRead();
      setNotifications(persisted);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
