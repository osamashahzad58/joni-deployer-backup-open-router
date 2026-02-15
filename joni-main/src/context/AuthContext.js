import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const fetchOpts = { credentials: 'include' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [instance, setInstance] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const res = await fetch('/api/auth/me', fetchOpts);
    if (!res.ok) {
      setUser(null);
      return null;
    }
    const data = await res.json();
    setUser(data.user);
    return data.user;
  }, []);

  const fetchInstance = useCallback(async () => {
    const res = await fetch('/api/user/instance', fetchOpts);
    if (!res.ok) {
      setInstance(null);
      return null;
    }
    const data = await res.json();
    setInstance(data.instance);
    return data.instance;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await fetchMe();
      if (cancelled || !u) {
        setAuthLoading(false);
        return;
      }
      await fetchInstance();
      setAuthLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchMe, fetchInstance]);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setUser(data.user);
    await fetchInstance();
    return data.user;
  };

  const signup = async (username, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    setUser(data.user);
    setInstance(null);
    return data.user;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setInstance(null);
  };

  const refreshInstance = useCallback(async () => {
    if (user) return fetchInstance();
  }, [user, fetchInstance]);

  const value = {
    user,
    instance,
    authLoading,
    login,
    logout,
    signup,
    refreshInstance,
    fetchMe,
    fetchInstance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
