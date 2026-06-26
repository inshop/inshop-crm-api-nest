import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createTestApp } from './helpers/create-test-app';
import { truncateAllTables } from './helpers/db-cleanup';
import { DataSource } from 'typeorm';
import { Project } from '../src/modules/projects/entities/project.entity';
import { Environment } from '../src/modules/environments/entities/environment.entity';
import { FeatureFlag } from '../src/modules/feature-flags/entities/feature-flag.entity';
import { FeatureFlagEnvironmentValue } from '../src/modules/feature-flags/entities/feature-flag-environment-value.entity';
import { User } from '../src/modules/permissions/entities/user.entity';
import { generateApiToken, hashApiToken, tokenPrefix } from '../src/modules/api-tokens/utils/token-hash';
import { ApiToken } from '../src/modules/api-tokens/entities/api-token.entity';

describe('Feature flags client API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let plainToken: string;
  let projectCode: string;
  let environmentCode: string;

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
    const usersRepository = app.get<Repository<User>>(
      getRepositoryToken(User),
    );
    const featureFlagsRepository = app.get<Repository<FeatureFlag>>(
      getRepositoryToken(FeatureFlag),
    );
    const environmentValuesRepository = app.get<
      Repository<FeatureFlagEnvironmentValue>
    >(getRepositoryToken(FeatureFlagEnvironmentValue));
    const apiTokensRepository = app.get<Repository<ApiToken>>(
      getRepositoryToken(ApiToken),
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
    const admin = await usersRepository.findOneByOrFail({
      email: 'admin@admin.admin',
    });

    const activeFlag = await featureFlagsRepository.save(
      featureFlagsRepository.create({
        name: 'Checkout',
        code: 'checkout',
        expiresAt: new Date('2099-01-01'),
        createdBy: admin,
        projects: [project],
      }),
    );

    await featureFlagsRepository.save(
      featureFlagsRepository.create({
        name: 'Expired',
        code: 'expired_flag',
        expiresAt: new Date('2000-01-01'),
        createdBy: admin,
        projects: [project],
      }),
    );

    await environmentValuesRepository.save(
      environmentValuesRepository.create({
        featureFlag: activeFlag,
        environment,
        enabled: true,
      }),
    );

    plainToken = generateApiToken();
    await apiTokensRepository.save(
      apiTokensRepository.create({
        name: 'Client token',
        tokenHash: hashApiToken(plainToken),
        tokenPrefix: tokenPrefix(plainToken),
        environment,
        createdBy: admin,
        isActive: true,
      }),
    );

    projectCode = project.code;
    environmentCode = environment.code;
  });

  it('GET /api/feature-flags/bootstrap returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get(
        `/api/feature-flags/bootstrap?project=${projectCode}&environment=${environmentCode}`,
      )
      .expect(401);
  });

  it('GET /api/feature-flags/bootstrap returns 403 for wrong environment', async () => {
    await request(app.getHttpServer())
      .get(`/api/feature-flags/bootstrap?project=${projectCode}&environment=production`)
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(403);
  });

  it('GET /api/feature-flags/bootstrap returns active flags', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/api/feature-flags/bootstrap?project=${projectCode}&environment=${environmentCode}`,
      )
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(200);

    expect(response.body).toEqual({
      feature_flags: { checkout: true },
    });
  });

  it('GET /api/feature-flags/:code returns enabled state', async () => {
    const activeResponse = await request(app.getHttpServer())
      .get(
        `/api/feature-flags/checkout?project=${projectCode}&environment=${environmentCode}`,
      )
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(200);

    expect(activeResponse.body).toEqual({ checkout: true });

    const inactiveResponse = await request(app.getHttpServer())
      .get(
        `/api/feature-flags/expired_flag?project=${projectCode}&environment=${environmentCode}`,
      )
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(200);

    expect(inactiveResponse.body).toEqual({ expired_flag: false });
  });

  it('GET /api/feature-flags/:code returns 404 for unknown code', async () => {
    await request(app.getHttpServer())
      .get(
        `/api/feature-flags/unknown?project=${projectCode}&environment=${environmentCode}`,
      )
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(404);
  });

  it('GET /api/feature-flags/:code returns 404 for unknown project', async () => {
    await request(app.getHttpServer())
      .get(
        `/api/feature-flags/checkout?project=unknown-project&environment=${environmentCode}`,
      )
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(404)
      .expect({ message: 'Project not found', statusCode: 404 });
  });
});
