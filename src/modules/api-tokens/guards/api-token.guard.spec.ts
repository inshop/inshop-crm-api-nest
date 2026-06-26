import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTokenGuard } from './api-token.guard';
import { ApiTokensService } from '../services/api-tokens.service';
import { hashApiToken } from '../utils/token-hash';

describe('ApiTokenGuard', () => {
  let guard: ApiTokenGuard;
  let apiTokensService: { findByTokenHash: jest.Mock };

  const environment = { id: 2, code: 'staging', name: 'Staging' };

  const createContext = (overrides?: {
    authorization?: string;
    environment?: string;
  }) => {
    const request = {
      headers: {
        authorization: overrides?.authorization,
      },
      query: {
        project: 'my-app',
        environment: overrides?.environment ?? 'staging',
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(() => {
    apiTokensService = {
      findByTokenHash: jest.fn(),
    };
    guard = new ApiTokenGuard(apiTokensService as unknown as ApiTokensService);
  });

  it('throws UnauthorizedException when header is missing', async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException for unknown token', async () => {
    apiTokensService.findByTokenHash.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createContext({ authorization: 'Bearer ff_unknown' }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(apiTokensService.findByTokenHash).toHaveBeenCalledWith(
      hashApiToken('ff_unknown'),
    );
  });

  it('throws ForbiddenException when environment is missing', async () => {
    apiTokensService.findByTokenHash.mockResolvedValue({
      environment,
    });

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer ff_valid' },
          query: {},
        }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when environment does not match', async () => {
    apiTokensService.findByTokenHash.mockResolvedValue({
      environment,
    });

    await expect(
      guard.canActivate(
        createContext({
          authorization: 'Bearer ff_valid',
          environment: 'production',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('attaches apiToken and environment on success', async () => {
    const apiToken = {
      id: 1,
      environment,
    };
    apiTokensService.findByTokenHash.mockResolvedValue(apiToken);

    const request = {
      headers: { authorization: 'Bearer ff_valid' },
      query: { project: 'my-app', environment: 'staging' },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toMatchObject({
      apiToken,
      environment,
    });
  });
});
