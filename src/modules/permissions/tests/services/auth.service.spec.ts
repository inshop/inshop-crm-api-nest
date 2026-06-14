import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../services/auth.service';
import { UserTokenService } from '../../services/user-token.service';
import { User } from '../../entities/user.entity';
import { Group } from '../../entities/group.entity';
import { Role } from '../../entities/role.entity';
import { TokenType } from '../../entities/user-token.entity';
import { AppRole } from '../../constants/roles.constants';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: {
    findOne: jest.Mock;
    findOneByOrFail: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let userTokenService: {
    createToken: jest.Mock;
    isTokenValid: jest.Mock;
    invalidateToken: jest.Mock;
    getAccessTokens: jest.Mock;
  };

  const activeUser = (): User => {
    const role = new Role();
    role.role = AppRole.CLIENT_LIST;

    const group = new Group();
    group.roles = [role];

    const user = new User();
    user.id = 1;
    user.name = 'Test User';
    user.email = 'test@example.com';
    user.password = bcrypt.hashSync('password', 10);
    user.isActive = true;
    user.group = group;

    return user;
  };

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
      save: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    };
    userTokenService = {
      createToken: jest.fn().mockResolvedValue(undefined),
      isTokenValid: jest.fn().mockResolvedValue(true),
      invalidateToken: jest.fn().mockResolvedValue(undefined),
      getAccessTokens: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: UserTokenService, useValue: userTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const user = activeUser();
      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.token).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(userTokenService.createToken).toHaveBeenCalledTimes(2);
    });

    it('throws for unknown user', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws for inactive user', async () => {
      const user = activeUser();
      user.isActive = false;
      usersRepository.findOne.mockResolvedValue(user);

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws for invalid password', async () => {
      usersRepository.findOne.mockResolvedValue(activeUser());

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyToken', () => {
    it('throws for invalid jwt', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(service.verifyToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when jti is missing', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: 1 });

      await expect(service.verifyToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when token is revoked', async () => {
      jwtService.verifyAsync.mockResolvedValue({ jti: 'jti-1', id: 1 });
      userTokenService.isTokenValid.mockResolvedValue(false);

      await expect(service.verifyToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when user is deactivated', async () => {
      const user = activeUser();
      user.isActive = false;

      jwtService.verifyAsync.mockResolvedValue({ jti: 'jti-1', id: 1 });
      usersRepository.findOne.mockResolvedValue(user);

      await expect(service.verifyToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns user for valid token', async () => {
      const user = activeUser();
      jwtService.verifyAsync.mockResolvedValue({ jti: 'jti-1', id: 1 });
      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.verifyToken('token', TokenType.ACCESS);

      expect(result.user).toBe(user);
      expect(userTokenService.isTokenValid).toHaveBeenCalledWith(
        'jti-1',
        TokenType.ACCESS,
      );
    });
  });

  describe('refresh', () => {
    it('invalidates old refresh token and issues new pair', async () => {
      const user = activeUser();
      jwtService.verifyAsync.mockResolvedValue({ jti: 'old-jti', id: 1 });
      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.refresh({ refreshToken: 'refresh-token' });

      expect(userTokenService.invalidateToken).toHaveBeenCalledWith('old-jti');
      expect(result.token).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
    });
  });

  describe('logout', () => {
    it('revokes refresh and all access tokens', async () => {
      const user = activeUser();
      jwtService.verifyAsync.mockResolvedValue({ jti: 'refresh-jti', id: 1 });
      usersRepository.findOne.mockResolvedValue(user);
      userTokenService.getAccessTokens.mockResolvedValue([
        { jti: 'access-1' },
        { jti: 'access-2' },
      ]);

      await service.logout({ refreshToken: 'refresh-token' });

      expect(userTokenService.invalidateToken).toHaveBeenCalledWith(
        'refresh-jti',
      );
      expect(userTokenService.invalidateToken).toHaveBeenCalledWith('access-1');
      expect(userTokenService.invalidateToken).toHaveBeenCalledWith('access-2');
    });
  });
});
