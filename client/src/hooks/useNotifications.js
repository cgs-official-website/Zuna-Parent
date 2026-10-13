import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services/notificationsService.js';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.listNotifications();
      setNotifications(Array.isArray(data) ? data : data?.notifications || []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleNew = (e) => {
      const newNotif = e.detail;
      if (newNotif) {
        setNotifications((prev) => [newNotif, ...prev]);
      }
    };

    window.addEventListener('socket:notification:new', handleNew);
    return () => window.removeEventListener('socket:notification:new', handleNew);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};
