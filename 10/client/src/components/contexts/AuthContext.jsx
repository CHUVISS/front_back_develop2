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
      console.log('Starting login process...');
      const response = await auth.login(email, password);
      console.log('Login response received:', response.data);
      
      const { accessToken, refreshToken, user: userData } = response.data;
      
      if (!accessToken || !refreshToken) {
        throw new Error('No tokens received');
      }
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(userData);
      console.log('Login successful, user loaded');
      return true;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Login failed';
      const errorCode = error.response?.data?.errorCode;
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Server is not responding. Please check if backend is running.';
      } else if (errorCode === 'USER_NOT_FOUND') {
        errorMessage = 'User not found. Please check your email or register first.';
      } else if (errorCode === 'INVALID_PASSWORD') {
        errorMessage = 'Invalid password. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found. Please check your email.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (!error.response) {
        errorMessage = 'Cannot connect to server. Make sure backend is running on port 3000.';
      }
      
      setError(errorMessage);
      return false;
    }
  };

  const register = async (email, password, firstName, lastName) => {
    try {
      setError(null);
      await auth.register({ email, password, firstName, lastName });
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

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};