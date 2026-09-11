import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

vi.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>;
    verifyAsync: ReturnType<typeof vi.fn>;
  };
  let configService: {
    get: ReturnType<typeof vi.fn>;
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'creator@somni.app',
    name: 'Somni Creator',
    role: 'OWNER',
    passwordHash: '$argon2id$mockedhash',
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    jwtService = {
      signAsync: vi.fn().mockImplementation((payload) => {
        return Promise.resolve(`signed-token-for-${payload.sub}`);
      }),
      verifyAsync: vi.fn(),
    };

    configService = {
      get: vi.fn().mockImplementation((key, defaultValue) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return defaultValue;
      }),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      vi.mocked(argon2.hash).mockResolvedValue('hashed-password' as never);
      prisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'new@somni.app',
        name: 'New Creator',
        role: 'OWNER',
      });

      const result = await service.register({
        email: 'new@somni.app',
        password: 'password123',
        name: 'New Creator',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@somni.app' },
      });
      expect(argon2.hash).toHaveBeenCalledWith('password123');
      expect(result.user.email).toBe('new@somni.app');
      expect(result.tokens.accessToken).toBe('signed-token-for-user-uuid-1');
      expect(result.tokens.refreshToken).toBe('signed-token-for-user-uuid-1');
    });

    it('should throw ConflictException if email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'creator@somni.app',
          password: 'password123',
          name: 'Somni Creator',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@somni.app',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(argon2.verify).mockResolvedValue(false as never);

      await expect(
        service.login({
          email: 'creator@somni.app',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user and tokens when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(argon2.verify).mockResolvedValue(true as never);

      const result = await service.login({
        email: 'creator@somni.app',
        password: 'password123',
      });

      expect(result.user.id).toBe('user-uuid-1');
      expect(result.tokens.accessToken).toBe('signed-token-for-user-uuid-1');
      expect(result.tokens.refreshToken).toBe('signed-token-for-user-uuid-1');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user in refresh payload no longer exists', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        email: 'creator@somni.app',
        role: 'OWNER',
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens when refresh token is valid', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        email: 'creator@somni.app',
        role: 'OWNER',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const tokens = await service.refresh('valid-token');

      expect(tokens.accessToken).toBe('signed-token-for-user-uuid-1');
      expect(tokens.refreshToken).toBe('signed-token-for-user-uuid-1');
    });
  });
});
