/**
 * CurrentUser Decorator.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Extracts the current user from the request object. One job.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
