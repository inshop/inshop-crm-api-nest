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
import { Project } from '../src/modules/projects/entities/project.entity';
import { Environment } from '../src/modules/environments/entities/environment.entity';

describe('API tokens admin API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let projectId: number;
  let environmentId: number;

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

    const projectsRepository = app.get<Repository<Project>>(
      getRepositoryToken(Project),
    );
    const environmentsRepository = app.get<Repository<Environment>>(
      getRepositoryToken(Environment),
    );

    const project = await projectsRepository.save(
      projectsRepository.create({
        name: 'My App',
        code: 'my-app',
        isActive: true,
      }),
    );
    const environment = await environmentsRepository.save(
      environmentsRepository.create({
        name: 'Staging',
        code: 'staging',
        isActive: true,
      }),
    );

    projectId = project.id;
    environmentId = environment.id;
  });

  async function loginAsAdmin() {
    const response = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: 'admin@admin.admin', password: 'admin@admin.admin' })
      .expect(201);

    return response.body.token as string;
  }

  it('GET /api/admin/api-tokens returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/api-tokens?take=10&skip=0')
      .expect(401);
  });

  it('GET /api/admin/api-tokens returns 403 without API_TOKEN_LIST role', async () => {
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
      .get('/api/admin/api-tokens?take=10&skip=0')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(403);
  });

  it('POST /api/admin/api-tokens creates token and returns plainToken once', async () => {
    const adminToken = await loginAsAdmin();

    const createResponse = await request(app.getHttpServer())
      .post('/api/admin/api-tokens')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'CI token',
        projectId,
        environmentId,
        isActive: true,
      })
      .expect(201);

    expect(createResponse.body.plainToken).toMatch(/^ff_/);
    expect(createResponse.body.name).toBe('CI token');
    expect(createResponse.body.project.code).toBe('my-app');
    expect(createResponse.body.environment.code).toBe('staging');

    const listResponse = await request(app.getHttpServer())
      .get('/api/admin/api-tokens?take=10&skip=0')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const [rows] = listResponse.body;
    expect(rows).toHaveLength(1);
    expect(rows[0].plainToken).toBeUndefined();
    expect(rows[0].tokenHash).toBeUndefined();
    expect(rows[0].encryptedToken).toBeUndefined();

    const detailsResponse = await request(app.getHttpServer())
      .get(`/api/admin/api-tokens/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(detailsResponse.body.plainToken).toBe(createResponse.body.plainToken);
    expect(detailsResponse.body.encryptedToken).toBeUndefined();
  });

  it('POST /api/admin/api-tokens/:id/regenerate returns new plainToken', async () => {
    const adminToken = await loginAsAdmin();

    const createResponse = await request(app.getHttpServer())
      .post('/api/admin/api-tokens')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Regenerate me',
        projectId,
        environmentId,
        isActive: true,
      })
      .expect(201);

    const regenerateResponse = await request(app.getHttpServer())
      .post(`/api/admin/api-tokens/${createResponse.body.id}/regenerate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(regenerateResponse.body.plainToken).toMatch(/^ff_/);
    expect(regenerateResponse.body.plainToken).not.toBe(
      createResponse.body.plainToken,
    );

    const detailsResponse = await request(app.getHttpServer())
      .get(`/api/admin/api-tokens/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(detailsResponse.body.plainToken).toBe(
      regenerateResponse.body.plainToken,
    );
  });
});
