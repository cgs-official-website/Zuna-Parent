import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import { FiWifiOff, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to /admin namespace with credentials
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketInstance = io(`${socketUrl}/admin`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      // Join standard rooms
      socketInstance.emit('join:room', 'tickets');
      if (user?.id) {
        socketInstance.emit('join:room', `admin:${user.id}`);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('reconnect_attempt', () => {
      setIsReconnecting(true);
    });

    socketInstance.on('reconnect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socketInstance.emit('join:room', 'tickets');
    });

    // Global live toast alerts for real-time events
    socketInstance.on('ticket:created', (data) => {
      const ticket = data.ticket || data;
      showToast(`🎫 New Ticket #${ticket.id || ''}: ${ticket.subject || 'New Support Request'}`, 'info', 6000);
      window.dispatchEvent(new CustomEvent('socket:ticket:created', { detail: ticket }));
    });

    socketInstance.on('ticket:updated', (data) => {
      const ticket = data.ticket || data;
      window.dispatchEvent(new CustomEvent('socket:ticket:updated', { detail: ticket }));
    });

    socketInstance.on('notification:new', (notification) => {
      showToast(`🔔 ${notification.title || 'New Alert'}: ${notification.message || ''}`, 'info', 5000);
      window.dispatchEvent(new CustomEvent('socket:notification:new', { detail: notification }));
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.id, showToast]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isReconnecting }}>
      {children}

      {/* Subtle Reconnection Status Banner */}
      <AnimatePresence>
        {isReconnecting && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            style={{
              position: 'fixed',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9998,
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(8px)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <FiWifiOff size={14} className="badge-pulse" />
            <span>Reconnecting to live realtime server...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
