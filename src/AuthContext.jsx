import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || 'https://dwdm-backend-oavt.onrender.com') + '/api';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  const login = async (user, pass) => {
    const body = new URLSearchParams();
    body.append('username', user);
    body.append('password', pass);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('username', data.username);
    setToken(data.access_token);
    setUsername(data.username);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken('');
    setUsername('');
  };

  const authHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider
      value={{ token, username, login, logout, isAuthed: !!token, authHeaders }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);