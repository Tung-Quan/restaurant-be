/**
 * CurrentUser Decorator.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - Extracts the current user from the request object. One job.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithUser = {
  user?: Record<string, unknown>;
};

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
