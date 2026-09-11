'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginCredentials, RegisterCredentials } from '../types';

export function useCurrentUser() {
  const { accessToken, setAuth } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { user } = await authApi.getMe();
      if (accessToken) {
        setAuth(user, accessToken);
      }
      return user;
    },
    enabled: Boolean(accessToken),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

export function useInitAuth() {
  const { isInitialized, setAccessToken, setInitialized } = useAuthStore();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (isInitialized) {
      return;
    }

    let isMounted = true;

    async function rehydrateSession() {
      try {
        const { accessToken } = await authApi.refresh();
        if (isMounted) {
          setAccessToken(accessToken);
          const { user } = await authApi.getMe();
          if (isMounted) {
            useAuthStore.getState().setAuth(user, accessToken);
            queryClient.setQueryData(['currentUser'], user);
          }
        }
      } catch {
        if (isMounted) {
          setInitialized(true);
        }
      }
    }

    void rehydrateSession();

    return () => {
      isMounted = false;
    };
  }, [isInitialized, setAccessToken, setInitialized, queryClient]);
}
