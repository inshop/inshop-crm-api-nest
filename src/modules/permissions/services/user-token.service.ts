import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserToken, TokenType } from '../entities/user-token.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class UserTokenService {
  constructor(
    @InjectRepository(UserToken)
    private tokenRepository: Repository<UserToken>,
  ) {}

  async createToken(record: {
    jti: string;
    type: TokenType;
    user: User;
    expiresAt?: Date;
    ip?: string;
    userAgent?: string;
  }): Promise<UserToken> {
    const entity = this.tokenRepository.create({
      jti: record.jti,
      type: record.type,
      user: record.user,
      expiresAt: record.expiresAt,
      ip: record.ip,
      userAgent: record.userAgent,
    });

    return this.tokenRepository.save(entity);
  }

  async invalidateToken(jti: string): Promise<void> {
    const entry = await this.tokenRepository.findOne({
      where: { jti },
    });

    if (!entry) {
      return;
    }

    entry.revokedAt = new Date();
    await this.tokenRepository.save(entry);
  }

  async isTokenValid(jti: string): Promise<boolean> {
    const entry = await this.tokenRepository.findOne({
      where: { jti },
    });

    if (!entry) {
      return false;
    }

    if (entry.revokedAt) {
      return false;
    }

    if (entry.expiresAt && entry.expiresAt <= new Date()) {
      return false;
    }

    return true;
  }

  async getAccessTokens(user: User): Promise<UserToken[]> {
    return this.tokenRepository.find({
      where: {
        user: { id: user.id },
        type: TokenType.ACCESS,
      },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.tokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', {
        now: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      })
      .execute();
  }
}
