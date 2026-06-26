import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../guards/roles.guard';
import { User } from '../../entities/user.entity';
import { Group } from '../../entities/group.entity';
import { Role } from '../../entities/role.entity';
import { AppRole } from '../../constants/roles.constants';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const createContext = (user?: User): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  const userWithRoles = (roles: AppRole[]): User => {
    const roleEntities = roles.map((role) => {
      const entity = new Role();
      entity.role = role;
      return entity;
    });

    const group = new Group();
    group.roles = roleEntities;

    const user = new User();
    user.group = group;
    return user;
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('throws when user is missing from request', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRole.PROJECT_LIST]);

    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });

  it('throws when user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRole.PROJECT_LIST]);

    expect(() =>
      guard.canActivate(createContext(userWithRoles([AppRole.USER_LIST]))),
    ).toThrow(ForbiddenException);
  });

  it('allows access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRole.PROJECT_LIST]);

    expect(
      guard.canActivate(createContext(userWithRoles([AppRole.PROJECT_LIST]))),
    ).toBe(true);
  });
});
