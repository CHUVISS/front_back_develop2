import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth } from '../../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await auth.login(email, password);
      const { accessToken, refreshToken, user: userData } = response.data;
      
      if (!accessToken || !refreshToken) {
        throw new Error('No tokens received');
      }
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(userData);
      return true;
    } catch (error) {
      let errorMessage = 'Login failed';
      const errorCode = error.response?.data?.errorCode;
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Server is not responding.';
      } else if (errorCode === 'USER_NOT_FOUND') {
        errorMessage = 'User not found. Please check your email.';
      } else if (errorCode === 'INVALID_PASSWORD') {
        errorMessage = 'Invalid password.';
      } else if (errorCode === 'ACCOUNT_BLOCKED') {
        errorMessage = 'Your account is blocked. Contact administrator.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      return false;
    }
  };

  const register = async (email, password, firstName, lastName, role) => {
    try {
      setError(null);
      await auth.register({ email, password, firstName, lastName, role });
      return await login(email, password);
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  // 🔹 Хелперы для проверки ролей
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const isAdmin = () => hasRole('admin');
  const isSeller = () => hasRole(['seller', 'admin']);
  const isUser = () => hasRole(['user', 'seller', 'admin']);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    hasRole,
    isAdmin,
    isSeller,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};