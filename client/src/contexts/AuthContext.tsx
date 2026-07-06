import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { TRPCClientError } from '@trpc/client';
import type { LoginInput, SignupInput } from '@shared/validation';
import { trpc, setAccessToken } from '@/lib/trpc';

interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof TRPCClientError) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation();
  const signupMutation = trpc.auth.signup.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const refreshMutation = trpc.auth.refresh.useMutation();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await refreshMutation.mutateAsync();
        if (cancelled) return;
        setAccessToken(result.accessToken);
        setUser(result.user);
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await loginMutation.mutateAsync(input);
      setAccessToken(result.accessToken);
      setUser(result.user);
      await utils.invalidate();
    },
    [loginMutation, utils],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      const result = await signupMutation.mutateAsync(input);
      setAccessToken(result.accessToken);
      setUser(result.user);
      await utils.invalidate();
    },
    [signupMutation, utils],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      setAccessToken(null);
      setUser(null);
      await utils.invalidate();
    }
  }, [logoutMutation, utils]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export type { AuthUser };
