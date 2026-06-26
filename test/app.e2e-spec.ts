import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createTestApp } from './helpers/create-test-app';
import { truncateAllTables } from './helpers/db-cleanup';
import { DataSource } from 'typeorm';
import { Group } from '../src/modules/permissions/entities/group.entity';
import { User } from '../src/modules/permissions/entities/user.entity';
import { AppRole } from '../src/modules/permissions/constants/roles.constants';
import { Role } from '../src/modules/permissions/entities/role.entity';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
    const { RolesSyncService } = await import(
      '../src/modules/permissions/services/roles-sync.service'
    );
    await app.get(RolesSyncService).sync();
  });

  it('POST /api/admin/auth/login returns tokens for valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: 'admin@admin.admin', password: 'admin@admin.admin' })
      .expect(201);

    expect(response.body.token).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('POST /api/admin/auth/login returns 401 for bad password', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: 'admin@admin.admin', password: 'wrong-password' })
      .expect(401);
  });

  it('GET /api/admin/feature-flags returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/feature-flags')
      .expect(401);
  });

  it('GET /api/admin/feature-flags returns 403 without FEATURE_FLAG_LIST role', async () => {
    const groupsRepository = app.get<Repository<Group>>(
      getRepositoryToken(Group),
    );
    const rolesRepository = app.get<Repository<Role>>(
      getRepositoryToken(Role),
    );
    const usersRepository = app.get<Repository<User>>(
      getRepositoryToken(User),
    );

    const userListRole = await rolesRepository.findOne({
      where: { role: AppRole.USER_LIST },
    });

    const limitedGroup = groupsRepository.create({
      name: 'limited',
      roles: userListRole ? [userListRole] : [],
    });
    await groupsRepository.save(limitedGroup);

    const limitedUser = usersRepository.create({
      name: 'Limited User',
      email: 'limited@example.com',
      password: 'limited-password',
      group: limitedGroup,
      isActive: true,
    });
    await usersRepository.save(limitedUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: 'limited@example.com', password: 'limited-password' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/admin/feature-flags?take=10&skip=0')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(403);
  });

  it('GET /api/admin/feature-flags returns 200 for admin token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: 'admin@admin.admin', password: 'admin@admin.admin' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/admin/feature-flags?take=10&skip=0')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
