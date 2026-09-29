import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('urbancart_token') || '');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authAttempt, setAuthAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      if (!token) {
        delete api.defaults.headers.common.Authorization;
        if (!cancelled) {
          setUser(null);
          setAuthError('');
          setLoading(false);
        }
        return;
      }

      try {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        const res = await api.get('/auth/me');
        if (!cancelled) {
          setUser(res.data.user);
          setAuthError('');
        }
      } catch (error) {
        if (!cancelled && error.response?.status === 401) {
          localStorage.removeItem('urbancart_token');
          delete api.defaults.headers.common.Authorization;
          setToken('');
          setUser(null);
          setAuthError('');
        } else if (!cancelled) {
          setAuthError('Your account could not be checked. Please retry.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUser();
    return () => { cancelled = true; };
  }, [token, authAttempt]);

  const login = async (payload) => {
    const res = await api.post('/auth/login', payload);
    setToken(res.data.token);
    localStorage.setItem('urbancart_token', res.data.token);
    setUser(res.data.user);
    setAuthError('');
    return res.data;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    setToken(res.data.token);
    localStorage.setItem('urbancart_token', res.data.token);
    setUser(res.data.user);
    setAuthError('');
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('urbancart_token');
    delete api.defaults.headers.common.Authorization;
    setToken('');
    setUser(null);
    setAuthError('');
  };

  const retryAuth = () => setAuthAttempt((attempt) => attempt + 1);
  const value = useMemo(() => ({ user, token, loading, authError, retryAuth, login, register, logout, setUser }), [user, token, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
