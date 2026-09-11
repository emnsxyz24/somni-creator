import { apiClient } from '@/lib/api-client';
import type {
  AuthResponse,
  LoginCredentials,
  RefreshResponse,
  RegisterCredentials,
  User,
} from '../types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    }),

  register: (credentials: RegisterCredentials) =>
    apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    }),

  refresh: () =>
    apiClient<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    }),

  getMe: () => apiClient<{ user: User }>('/auth/me'),

  logout: () =>
    apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),
};
