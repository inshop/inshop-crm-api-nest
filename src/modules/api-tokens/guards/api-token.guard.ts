import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTokensService } from '../services/api-tokens.service';
import { hashApiToken } from '../utils/token-hash';
import { ApiToken } from '../entities/api-token.entity';
import { Environment } from '../../environments/entities/environment.entity';

export type ApiTokenRequest = Request & {
  apiToken: ApiToken;
  environment: Environment;
};

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(private apiTokensService: ApiTokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiTokenRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const apiToken = await this.apiTokensService.findByTokenHash(
      hashApiToken(token),
    );

    if (!apiToken) {
      throw new UnauthorizedException();
    }

    const environmentCode = this.getQueryParam(request, 'environment');

    if (!environmentCode) {
      throw new ForbiddenException('environment query param is required');
    }

    if (apiToken.environment.code !== environmentCode) {
      throw new ForbiddenException('Token scope does not match environment');
    }

    request.apiToken = apiToken;
    request.environment = apiToken.environment;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private getQueryParam(request: Request, key: string): string | undefined {
    const value = request.query[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    return undefined;
  }
}
