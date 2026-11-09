import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types/user';
import { LoginPayload, TokenPair } from '@/types/auth';
import { authService } from '@/lib/api/auth.service';
import { getStoredTokens, registerUnauthorizedCallback, saveStoredTokens } from '@/lib/api/client';
import { disconnectSocket, initSocket } from '@/lib/socket/socketClient';

interface AuthContextValue {
  user: User | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUserState: (updated: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<TokenPair | null>(() => getStoredTokens());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      initSocket();
    } catch {
      setUser(null);
      setTokens(null);
      saveStoredTokens(null);
      disconnectSocket();
    }
  }, []);

  useEffect(() => {
    // Register 401 callback for automatic session invalidation
    const unregister = registerUnauthorizedCallback(() => {
      setUser(null);
      setTokens(null);
      saveStoredTokens(null);
      disconnectSocket();
    });

    const stored = getStoredTokens();
    if (stored?.accessToken) {
      setTokens(stored);
      fetchCurrentUser().finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      unregister();
    };
  }, [fetchCurrentUser]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const tokenPair = await authService.login(payload);
      setTokens(tokenPair);
      // Fetch user profile immediately
      const userData = await authService.getMe();
      setUser(userData);
      initSocket();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const current = getStoredTokens();
      await authService.logout({ refreshToken: current?.refreshToken });
    } finally {
      setUser(null);
      setTokens(null);
      saveStoredTokens(null);
      disconnectSocket();
      setIsLoading(false);
    }
  };

  const updateCurrentUserState = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const refreshUser = async () => {
    const userData = await authService.getMe();
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        login,
        logout,
        updateCurrentUserState,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
