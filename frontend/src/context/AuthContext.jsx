import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      setPermissions(res.data.permissions || {});
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchUser();
      
      // Poll every 30 seconds to keep permissions up to date
      const interval = setInterval(() => {
        fetchUser();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    fetchUser(); // fetch permissions immediately after login
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPermissions({});
  };

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
