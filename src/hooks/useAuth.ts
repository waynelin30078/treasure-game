// Auth state hook: manages the logged-in user, persists the JWT, and restores
// the session on load. Score persistence is "highest only" (tracked here too).
import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';

export interface AuthUser {
  username: string;
  highScore: number;
}

export interface UseAuth {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setHighScore: (highScore: number) => void;
}

// React hook exposing auth state and actions. Input: none. Output: UseAuth.
export function useAuth(): UseAuth {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore the session from a stored token (if any).
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((me) => setUser(me))
      .catch(() => api.clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    api.setToken(res.token);
    setUser({ username: res.username, highScore: res.highScore });
  }, []);

  const signup = useCallback(async (username: string, password: string) => {
    const res = await api.signup(username, password);
    api.setToken(res.token);
    setUser({ username: res.username, highScore: res.highScore });
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);

  // Updates the locally tracked high score (after a score submission).
  const setHighScore = useCallback((highScore: number) => {
    setUser((prev) => (prev ? { ...prev, highScore } : prev));
  }, []);

  return { user, loading, login, signup, logout, setHighScore };
}
