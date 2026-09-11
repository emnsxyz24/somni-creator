import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter.js';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    const mockResponse = {
      status: mockStatus,
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: vi.fn(),
        getNext: vi.fn(),
      }),
    } as unknown as ArgumentsHost;
  });

  it('formats NotFoundException into standardized error envelope', () => {
    const exception = new NotFoundException('Resource not found');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: null,
      },
    });
  });

  it('formats validation array error from BadRequestException', () => {
    const exception = new BadRequestException({
      message: ['title must not be empty', 'email must be an email'],
      error: 'Bad Request',
      statusCode: 400,
    });

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: ['title must not be empty', 'email must be an email'],
      },
    });
  });

  it('handles custom code and details in HttpException response', () => {
    const exception = new HttpException(
      {
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found or does not belong to your account',
        details: { dealId: '123' },
      },
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found or does not belong to your account',
        details: { dealId: '123' },
      },
    });
  });

  it('handles unexpected non-HttpException errors safely without exposing stack traces', () => {
    const exception = new Error('Database connection unexpectedly dropped');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal server error occurred',
        details: null,
      },
    });
  });
});
