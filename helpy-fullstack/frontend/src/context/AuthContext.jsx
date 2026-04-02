import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((r) => {
        setUser(r.data);
        sessionStorage.setItem('user', JSON.stringify(r.data));
      })
      .catch(() => {
        setUser(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (email, password, role) => {
    // Clear stale state before login attempt
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    setUser(null);

    return authApi.login(email, password, role).then((r) => {
      sessionStorage.setItem('token', r.data.token);
      sessionStorage.setItem('refreshToken', r.data.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(r.data.user));
      setUser(r.data.user);
      return r.data;
    });
  };

  const register = (email, password, name, role) =>
    authApi.register(email, password, name, role).then((r) => {
      sessionStorage.setItem('token', r.data.token);
      sessionStorage.setItem('refreshToken', r.data.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(r.data.user));
      setUser(r.data.user);
      return r.data;
    });

  const registerOfficial = (email, password, name, role) =>
    authApi.registerOfficial(email, password, name, role).then((r) => r.data);

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const isAgent = user && ['Admin', 'Agent', 'Manager', 'Super Admin'].includes(user.role);
  const isAdmin = user && ['Super Admin', 'Admin'].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerOfficial, logout, isAgent, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
