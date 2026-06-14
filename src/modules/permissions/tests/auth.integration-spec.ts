import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { AuthService } from '../services/auth.service';
import { RolesSyncService } from '../services/roles-sync.service';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { Role } from '../entities/role.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { TokenType } from '../entities/user-token.entity';
import { truncateAllTables } from '../../../../test/helpers/db-cleanup';
import { isBcryptHash } from '../../core/utils/password';
import { allRoles } from '../constants/roles.constants';

describe('Auth integration', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersRepository: Repository<User>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = app.get(AuthService);
    usersRepository = app.get(getRepositoryToken(User));
    dataSource = app.get(DataSource);

    await app.get(RolesSyncService).sync();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
    await app.get(RolesSyncService).sync();
  });

  it('login, verify, refresh, logout lifecycle', async () => {
    const { token, refreshToken } = await authService.login({
      email: 'admin@admin.admin',
      password: 'admin@admin.admin',
    });

    const { user } = await authService.verifyToken(token, TokenType.ACCESS);
    expect(user.email).toBe('admin@admin.admin');

    const refreshed = await authService.refresh({ refreshToken });
    expect(refreshed.token).toBeDefined();
    expect(refreshed.refreshToken).toBeDefined();

    await authService.logout({ refreshToken: refreshed.refreshToken });

    await expect(
      authService.verifyToken(refreshed.token, TokenType.ACCESS),
    ).rejects.toThrow();
  });

  it('stores bcrypt password for newly created user', async () => {
    const groupsRepository = app.get<Repository<Group>>(
      getRepositoryToken(Group),
    );
    const adminGroup = await groupsRepository.findOne({
      where: { name: 'admin' },
    });

    const user = usersRepository.create({
      name: 'Plain User',
      email: 'plain@example.com',
      password: 'plain-password',
      group: adminGroup!,
      isActive: true,
    });

    const saved = await usersRepository.save(user);
    const loaded = await usersRepository.findOneBy({ id: saved.id });

    expect(isBcryptHash(loaded!.password)).toBe(true);
  });
});

describe('RolesSync integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let rolesSyncService: RolesSyncService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    rolesSyncService = app.get(RolesSyncService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
  });

  it('creates modules and roles from constants', async () => {
    await rolesSyncService.sync();

    const modulesRepository = app.get<Repository<ModuleEntity>>(
      getRepositoryToken(ModuleEntity),
    );
    const rolesRepository = app.get<Repository<Role>>(
      getRepositoryToken(Role),
    );

    const modules = await modulesRepository.find();
    const roles = await rolesRepository.find();

    expect(modules.length).toBeGreaterThan(0);
    expect(roles.length).toBe(allRoles().length);
  });

  it('is idempotent on re-run', async () => {
    await rolesSyncService.sync();
    const rolesRepository = app.get<Repository<Role>>(
      getRepositoryToken(Role),
    );
    const countAfterFirst = await rolesRepository.count();

    await rolesSyncService.sync();
    const countAfterSecond = await rolesRepository.count();

    expect(countAfterSecond).toBe(countAfterFirst);
  });
});
