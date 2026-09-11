import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let res: {
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'creator@somni.app',
    name: 'Somni Creator',
    role: 'OWNER',
  };

  const mockTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
  };

  beforeEach(() => {
    authService = {
      register: vi.fn(),
      login: vi.fn(),
      refresh: vi.fn(),
    };

    res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  describe('register', () => {
    it('should register user, set refresh cookie, and return user with access token', async () => {
      authService.register.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const result = await controller.register(
        {
          email: 'creator@somni.app',
          password: 'password123',
          name: 'Somni Creator',
        },
        res as unknown as Response,
      );

      expect(authService.register).toHaveBeenCalledWith({
        email: 'creator@somni.app',
        password: 'password123',
        name: 'Somni Creator',
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token-456',
        expect.objectContaining({
          httpOnly: true,
          path: '/api/v1/auth',
        }),
      );
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'access-token-123',
      });
    });
  });

  describe('login', () => {
    it('should log in user, set refresh cookie, and return user with access token', async () => {
      authService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const result = await controller.login(
        { email: 'creator@somni.app', password: 'password123' },
        res as unknown as Response,
      );

      expect(authService.login).toHaveBeenCalledWith({
        email: 'creator@somni.app',
        password: 'password123',
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token-456',
        expect.any(Object),
      );
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'access-token-123',
      });
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if no refresh token is provided', async () => {
      const req = { cookies: {} } as Request;

      await expect(
        controller.refresh(req, {}, res as unknown as Response),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should refresh tokens from cookie', async () => {
      const req = {
        cookies: { refreshToken: 'cookie-refresh-token' },
      } as unknown as Request;
      authService.refresh.mockResolvedValue(mockTokens);

      const result = await controller.refresh(
        req,
        {},
        res as unknown as Response,
      );

      expect(authService.refresh).toHaveBeenCalledWith('cookie-refresh-token');
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token-456',
        expect.any(Object),
      );
      expect(result).toEqual({ accessToken: 'access-token-123' });
    });

    it('should refresh tokens from body fallback', async () => {
      const req = { cookies: {} } as unknown as Request;
      authService.refresh.mockResolvedValue(mockTokens);

      const result = await controller.refresh(
        req,
        { refreshToken: 'body-refresh-token' },
        res as unknown as Response,
      );

      expect(authService.refresh).toHaveBeenCalledWith('body-refresh-token');
      expect(result).toEqual({ accessToken: 'access-token-123' });
    });
  });

  describe('logout', () => {
    it('should clear refresh token cookie and return success message', () => {
      const result = controller.logout(res as unknown as Response);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/api/v1/auth',
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getProfile', () => {
    it('should return the current authenticated user', () => {
      const user = {
        id: 'user-uuid-1',
        email: 'creator@somni.app',
        name: 'Somni Creator',
        role: 'OWNER',
        createdAt: new Date(),
      };

      const result = controller.getProfile(user);
      expect(result).toEqual({ user });
    });
  });
});
