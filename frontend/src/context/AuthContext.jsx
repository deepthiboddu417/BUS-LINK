import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('buslink_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('buslink_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('buslink_user');
        localStorage.removeItem('buslink_token');
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        setToken(userData.token);
        localStorage.setItem('buslink_token', userData.token);
        localStorage.setItem('buslink_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid credentials' };
    }
  };

  const loginWithUserData = (userData) => {
    setUser(userData);
    setToken(userData.token);
    localStorage.setItem('buslink_token', userData.token);
    localStorage.setItem('buslink_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('buslink_token');
    localStorage.removeItem('buslink_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithUserData, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
