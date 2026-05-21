import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import adminApi, { unwrap } from '../api/adminApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const { data } = unwrap(await adminApi.get('/admin/auth/me'));
        if (data) {
          setUser(data);
          localStorage.setItem('classyshop_user', JSON.stringify(data));
          return;
        }
      } catch {
        const savedUser = localStorage.getItem('classyshop_user');
        if (savedUser) setUser(JSON.parse(savedUser));
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
    setUser(data);
    if (data?.token) localStorage.setItem('classyshop_admin_token', data.token);
    localStorage.setItem('classyshop_user', JSON.stringify(data));
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post('/api/auth/register', { name, email, password });
    setUser(data);
    localStorage.setItem('classyshop_user', JSON.stringify(data));
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('classyshop_user');
    localStorage.removeItem('classyshop_admin_token');
  };

  const authHeader = () => {
    const token = user?.token || localStorage.getItem('classyshop_admin_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
