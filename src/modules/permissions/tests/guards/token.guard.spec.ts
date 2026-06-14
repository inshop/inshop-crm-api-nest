import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenGuard } from '../../guards/token.guard';
import { AuthService } from '../../services/auth.service';
import { User } from '../../entities/user.entity';
import { TokenType } from '../../entities/user-token.entity';

describe('TokenGuard', () => {
  let guard: TokenGuard;
  let authService: { verifyToken: jest.Mock };

  const createContext = (headers: Record<string, string> = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    authService = { verifyToken: jest.fn() };
    guard = new TokenGuard(authService as unknown as AuthService);
  });

  it('throws when authorization header is missing', async () => {
    await expect(guard.canActivate(createContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws when bearer token is malformed', async () => {
    await expect(
      guard.canActivate(createContext({ authorization: 'Token abc' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('attaches user to request for valid token', async () => {
    const user = new User();
    user.id = 1;
    authService.verifyToken.mockResolvedValue({ user });

    const request = { headers: { authorization: 'Bearer valid-token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toHaveProperty('user', user);
    expect(authService.verifyToken).toHaveBeenCalledWith(
      'valid-token',
      TokenType.ACCESS,
    );
  });
});
