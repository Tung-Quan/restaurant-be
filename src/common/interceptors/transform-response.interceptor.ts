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

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the data already has 'success' property, pass through (e.g., paginated responses)
        if (data && typeof data === 'object' && 'success' in data) {
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
