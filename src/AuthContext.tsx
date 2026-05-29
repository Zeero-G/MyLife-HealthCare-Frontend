/**
 * MyLife Auth Context
 * Provides authentication state and actions across the entire app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from './types';
import { authAPI, setTokens, clearTokens, getToken } from './api';
import { clearEmergencyProfileCache } from './utils/emergencyProfileCache';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, role?: UserRole, gender?: 'male' | 'female') => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (data: { full_name: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: check for existing token and validate
  useEffect(() => {
    const token = getToken();
    if (token) {
      authAPI.me()
        .then(setUser)
        .catch(() => {
          clearTokens();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const tokens = await authAPI.login({ email, password });
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authAPI.me();
      setUser(me);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string, role: UserRole = 'patient', gender?: 'male' | 'female') => {
    setError(null);
    setIsLoading(true);
    try {
      const tokens = await authAPI.register({
        full_name: fullName,
        email,
        password,
        role: 'patient',
        gender,
      });
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authAPI.me();
      setUser(me);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authAPI.logout().catch(() => {});
    clearTokens();
    clearEmergencyProfileCache();
    localStorage.removeItem('mylife_view');
    localStorage.removeItem('mylife_tab');
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const updateUser = useCallback(async (data: { full_name: string }) => {
    const updated = await authAPI.updateMe(data);
    setUser(updated);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authAPI.me();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
