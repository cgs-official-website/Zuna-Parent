import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService.js';
import { setAccessToken } from '../services/apiClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and restore session on mount
  const initSession = useCallback(async () => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    try {
      // First attempt to refresh token via httpOnly cookie
      const refreshResult = await authService.refresh().catch(() => null);
      if (refreshResult?.accessToken) {
        setAccessToken(refreshResult.accessToken);
        const currentUser = await authService.getMe().catch(() => null);
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();

    const handleExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:session-expired', handleExpired);
    return () => window.removeEventListener('auth:session-expired', handleExpired);
  }, [initSession]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const loggedUser = data.user || (await authService.getMe());
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      window.location.href = '/admin';
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshUser: initSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
