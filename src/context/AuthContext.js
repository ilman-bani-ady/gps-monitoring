import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek session ke backend
    const checkSession = async () => {
      try {
        const res = await fetch('http://103.245.39.149:3013/api/auth/session', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('No session');
        const data = await res.json();
        setIsLoggedIn(true);
        setUser(data.data.user);
      } catch {
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (username, password) => {
    const res = await fetch('http://103.245.39.149:3013/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Login failed');
    }
    const data = await res.json();
    setIsLoggedIn(true);
    setUser(data.data.user);
  };

  const logout = async () => {
    // Hapus cookie di backend (opsional: buat endpoint logout)
    document.cookie = 'token=; Max-Age=0; path=/;';
    setIsLoggedIn(false);
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>; // Atau spinner
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 