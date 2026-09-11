import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const testEmail = `creator-e2e-${Date.now()}@somni.app`;
  const testPassword = 'Password123!';
  const testName = 'E2E Creator';
  let accessToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    } finally {
      await app.close();
    }
  });

  it('POST /api/v1/auth/register should fail validation on invalid payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        password: 'short',
        name: '',
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('POST /api/v1/auth/register should create user and return tokens with cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: testName,
      })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.name).toBe(testName);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.accessToken;
  });

  it('POST /api/v1/auth/register should reject duplicate email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: testName,
      })
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('POST /api/v1/auth/login should reject invalid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword!',
      })
      .expect(401);

    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/auth/login should authenticate valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    expect(res.body.user.email).toBe(testEmail);
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.accessToken;
  });

  it('GET /api/v1/auth/me should reject unauthenticated request', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('GET /api/v1/auth/me should return creator profile with valid Bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.name).toBe(testName);
  });

  it('POST /api/v1/auth/logout should clear refreshToken cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .expect(200);

    expect(res.body.message).toBe('Logged out successfully');
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
