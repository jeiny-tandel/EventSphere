import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: string;
  email: string;
}

interface AuthenticatedRequest {
  user?: CurrentUserPayload;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: CurrentUserPayload | undefined = request.user;

    return data && user ? user[data] : user;
  },
);
