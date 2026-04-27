/**
 * Response Transformer Interceptor.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - This interceptor has one responsibility: wrapping all successful responses
 *   in the standard ApiResponse format.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - Applied globally via NestJS interceptor mechanism. New controllers automatically
 *   benefit without modification.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface.js';

const hasApiResponseShape = <T>(
  data: T | ApiResponse<T>,
): data is ApiResponse<T> =>
  typeof data === 'object' && data !== null && 'success' in data;

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const acceptHeader = request.headers?.accept;
    const acceptsEventStream = Array.isArray(acceptHeader)
      ? acceptHeader.some((value) => value.includes('text/event-stream'))
      : acceptHeader?.includes('text/event-stream');

    if (acceptsEventStream) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    return next.handle().pipe(
      map((data: T | ApiResponse<T>) => {
        // If the data already has 'success' property, pass through (e.g., paginated responses)
        if (hasApiResponseShape(data)) {
          return data;
        }
        return {
          success: true,
          data,
          error: null,
        };
      }),
    );
  }
}
