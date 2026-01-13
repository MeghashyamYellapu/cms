import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
    }
  }, []);

  const fetchAdmin = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setAdmin(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch admin error:', error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      fetchAdmin();
    } else {
      setLoading(false);
    }
  }, [token, fetchAdmin]);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { admin: adminData, token: authToken } = response.data.data;
      
      setAdmin(adminData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('admin', JSON.stringify(adminData));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const value = {
    admin,
    loading,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === 'SuperAdmin',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
