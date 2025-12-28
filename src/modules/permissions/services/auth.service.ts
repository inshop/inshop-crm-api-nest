import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from '../dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserTokenService } from './user-token.service';
import { TokenType } from '../entities/user-token.entity';
import * as crypto from 'node:crypto';
import { ResponseAuthDto } from '../dto/response/response-auth.dto';
import { RefreshAuthDto } from '../dto/refresh-auth.dto';
import { LogoutAuthDto } from '../dto/logout-auth.dto';
import config from '../../../config/config';

type UserJwtPayload = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

type JwtPayload = {
  jti: string;
};

type VerifiedToken = JwtPayload & UserJwtPayload;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private userTokenService: UserTokenService,
  ) {}

  private async issueToken(user: User, type: TokenType): Promise<string> {
    const payload: UserJwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles(),
    };

    const expiresIn = type === TokenType.REFRESH ? 7 * 24 * 60 * 60 : 60 * 60;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const jti = crypto.randomUUID();

    const token = await this.jwtService.signAsync(payload, {
      expiresIn,
      jwtid: jti,
    });

    await this.userTokenService.createToken({
      jti,
      type,
      user,
      expiresAt,
    });

    return token;
  }

  public async verifyToken(
    token: string,
  ): Promise<{ verified: VerifiedToken; user: User }> {
    let verified: VerifiedToken;

    try {
      verified = await this.jwtService.verifyAsync<VerifiedToken>(token, {
        secret: config().jwtSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const jti = verified.jti;
    if (!jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await this.userTokenService.isTokenValid(jti);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: verified.id },
      relations: {
        group: {
          roles: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { verified, user };
  }

  async login(loginAuthDto: LoginAuthDto): Promise<ResponseAuthDto> {
    const user = await this.usersRepository.findOne({
      where: { email: loginAuthDto.email },
      relations: {
        group: {
          roles: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!bcrypt.compareSync(loginAuthDto.password, user.password)) {
      throw new UnauthorizedException();
    }

    const token = await this.issueToken(user, TokenType.ACCESS);
    const refreshToken = await this.issueToken(user, TokenType.REFRESH);

    return { token, refreshToken };
  }

  async refresh(refreshTokenDto: RefreshAuthDto): Promise<ResponseAuthDto> {
    const { verified, user } = await this.verifyToken(
      refreshTokenDto.refreshToken,
    );

    await this.userTokenService.invalidateToken(verified.jti);

    const token = await this.issueToken(user, TokenType.ACCESS);
    const refreshToken = await this.issueToken(user, TokenType.REFRESH);

    return { token, refreshToken };
  }

  async logout(logoutAuthDto: LogoutAuthDto) {
    const { verified, user } = await this.verifyToken(
      logoutAuthDto.refreshToken,
    );

    await this.userTokenService.invalidateToken(verified.jti);

    const accessTokens = await this.userTokenService.getAccessTokens(user);
    for (const accessToken of accessTokens) {
      await this.userTokenService.invalidateToken(accessToken.jti);
    }

    return {
      message: 'Successfully logged out',
    };
  }
}
