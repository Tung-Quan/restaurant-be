/**
 * Global HTTP Exception Filter.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - This filter has one responsibility: catching all HTTP exceptions and
 *   formatting them into the standard error response shape.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - New exception types can be added without modifying this filter; they all
 *   extend HttpException and are caught uniformly.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as {
          message?: string | string[];
          code?: string;
          details?: Record<string, unknown>;
        };
        message =
          typeof res.message === 'string' ? res.message : exception.message;
        code = res.code ?? this.getErrorCode(status);
        details = res.details;

        // Handle class-validator errors
        if (Array.isArray(res.message)) {
          code = 'VALIDATION_ERROR';
          message = res.message.join(', ');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
    });
  }

  private getErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      500: 'INTERNAL_ERROR',
    };
    return codeMap[status] || 'UNKNOWN_ERROR';
  }
}
