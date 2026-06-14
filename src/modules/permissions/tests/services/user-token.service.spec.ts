import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserTokenService } from '../../services/user-token.service';
import { UserToken, TokenType } from '../../entities/user-token.entity';
import { User } from '../../entities/user.entity';

describe('UserTokenService', () => {
  let service: UserTokenService;
  let tokenRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    tokenRepository = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserTokenService,
        { provide: getRepositoryToken(UserToken), useValue: tokenRepository },
      ],
    }).compile();

    service = module.get<UserTokenService>(UserTokenService);
  });

  describe('createToken', () => {
    it('persists token record', async () => {
      const user = new User();
      user.id = 1;

      await service.createToken({
        jti: 'jti-1',
        type: TokenType.ACCESS,
        user,
        expiresAt: new Date(),
      });

      expect(tokenRepository.create).toHaveBeenCalled();
      expect(tokenRepository.save).toHaveBeenCalled();
    });
  });

  describe('isTokenValid', () => {
    it('returns false when token is missing', async () => {
      tokenRepository.findOne.mockResolvedValue(null);

      expect(await service.isTokenValid('missing')).toBe(false);
    });

    it('returns false when token is revoked', async () => {
      tokenRepository.findOne.mockResolvedValue({
        jti: 'jti-1',
        revokedAt: new Date(),
      });

      expect(await service.isTokenValid('jti-1')).toBe(false);
    });

    it('returns false when token is expired', async () => {
      tokenRepository.findOne.mockResolvedValue({
        jti: 'jti-1',
        expiresAt: new Date(Date.now() - 1000),
      });

      expect(await service.isTokenValid('jti-1')).toBe(false);
    });

    it('returns false when token type does not match', async () => {
      tokenRepository.findOne.mockResolvedValue({
        jti: 'jti-1',
        type: TokenType.REFRESH,
      });

      expect(
        await service.isTokenValid('jti-1', TokenType.ACCESS),
      ).toBe(false);
    });

    it('returns true for valid token', async () => {
      tokenRepository.findOne.mockResolvedValue({
        jti: 'jti-1',
        type: TokenType.ACCESS,
        expiresAt: new Date(Date.now() + 60_000),
      });

      expect(
        await service.isTokenValid('jti-1', TokenType.ACCESS),
      ).toBe(true);
    });
  });

  describe('invalidateToken', () => {
    it('sets revokedAt when token exists', async () => {
      const entry = { jti: 'jti-1', revokedAt: null as Date | null };
      tokenRepository.findOne.mockResolvedValue(entry);

      await service.invalidateToken('jti-1');

      expect(entry.revokedAt).toBeInstanceOf(Date);
      expect(tokenRepository.save).toHaveBeenCalledWith(entry);
    });

    it('does nothing when token is missing', async () => {
      tokenRepository.findOne.mockResolvedValue(null);

      await service.invalidateToken('missing');

      expect(tokenRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getAccessTokens', () => {
    it('returns access tokens for user', async () => {
      const user = new User();
      user.id = 1;
      tokenRepository.find.mockResolvedValue([{ jti: 'access-1' }]);

      const tokens = await service.getAccessTokens(user);

      expect(tokens).toHaveLength(1);
      expect(tokenRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 }, type: TokenType.ACCESS },
      });
    });
  });
});
