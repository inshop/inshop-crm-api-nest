import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiTokensService } from './api-tokens.service';
import { ApiToken } from '../entities/api-token.entity';
import { Environment } from '../../environments/entities/environment.entity';
import { AuditService } from '../../audit/services/audit.service';
import { User } from '../../permissions/entities/user.entity';
import { hashApiToken, tokenPrefix } from '../utils/token-hash';

jest.mock('../utils/token-hash', () => ({
  ...jest.requireActual('../utils/token-hash'),
  generateApiToken: jest.fn(),
}));

import { generateApiToken } from '../utils/token-hash';

describe('ApiTokensService', () => {
  let service: ApiTokensService;
  let apiTokensRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneOrFail: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    delete: jest.Mock;
  };
  let environmentsRepository: { findOneByOrFail: jest.Mock };
  let auditService: {
    logCreateIf: jest.Mock;
    logUpdateIf: jest.Mock;
    logDeleteIf: jest.Mock;
  };

  const environment = { id: 2, code: 'staging', name: 'Staging' };
  const actor = { id: 9, name: 'Admin' } as User;

  beforeEach(async () => {
    apiTokensRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(async (entity) => ({ id: 10, ...entity })),
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      delete: jest.fn(),
    };

    environmentsRepository = {
      findOneByOrFail: jest.fn().mockResolvedValue(environment),
    };

    auditService = {
      logCreateIf: jest.fn(),
      logUpdateIf: jest.fn(),
      logDeleteIf: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiTokensService,
        {
          provide: getRepositoryToken(ApiToken),
          useValue: apiTokensRepository,
        },
        {
          provide: getRepositoryToken(Environment),
          useValue: environmentsRepository,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get(ApiTokensService);
  });

  it('create stores token hash and returns plainToken once', async () => {
    const plainToken = 'ff_test_secret_token';
    jest.mocked(generateApiToken).mockReturnValue(plainToken);
    const savedToken = {
      id: 10,
      name: 'CI token',
      tokenPrefix: tokenPrefix(plainToken),
      environment,
      createdBy: actor,
      isActive: true,
      createdAt: new Date(),
    };

    apiTokensRepository.findOneOrFail.mockResolvedValue(savedToken);

    const result = await service.create(
      {
        name: 'CI token',
        environmentId: 2,
        isActive: true,
      },
      actor,
    );

    expect(apiTokensRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CI token',
        tokenHash: hashApiToken(plainToken),
        tokenPrefix: tokenPrefix(plainToken),
      }),
    );
    expect(result.plainToken).toBe(plainToken);
    expect(result.tokenPrefix).toBe(tokenPrefix(plainToken));
    expect(auditService.logCreateIf).toHaveBeenCalledWith(
      actor,
      'api_token',
      10,
      expect.not.objectContaining({ plainToken: expect.any(String) }),
    );
  });

  it('findOne does not return plainToken', async () => {
    apiTokensRepository.findOneOrFail.mockResolvedValue({
      id: 10,
      name: 'CI token',
      tokenPrefix: 'ff_test…oken',
      environment,
      createdBy: actor,
      isActive: true,
      createdAt: new Date(),
    });

    const result = await service.findOne(10);

    expect(result).not.toHaveProperty('plainToken');
    expect(result.tokenPrefix).toBe('ff_test…oken');
  });

  it('findAll filters by environmentId', async () => {
    await service.findAll(20, 0, {
      environmentId: '2',
      name: 'prod',
    });

    expect(apiTokensRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        skip: 0,
        where: expect.objectContaining({
          name: expect.anything(),
          environment: { id: 2 },
        }),
      }),
    );
  });

  it('update logs audit diff', async () => {
    const apiToken = {
      id: 5,
      name: 'Old',
      isActive: true,
      environment,
      createdBy: actor,
    };

    apiTokensRepository.findOneOrFail
      .mockResolvedValueOnce(apiToken)
      .mockResolvedValueOnce({ ...apiToken, name: 'New' });
    apiTokensRepository.save.mockImplementation(async (entity) => entity);

    await service.update(5, { name: 'New' }, actor);

    expect(auditService.logUpdateIf).toHaveBeenCalledWith(
      actor,
      'api_token',
      5,
      expect.objectContaining({ name: 'Old' }),
      expect.objectContaining({ name: 'New' }),
    );
  });

  it('update can change environment', async () => {
    const otherEnvironment = { id: 4, code: 'prod', name: 'Production' };
    const apiToken = {
      id: 5,
      name: 'Token',
      isActive: true,
      environment,
      createdBy: actor,
    };

    apiTokensRepository.findOneOrFail
      .mockResolvedValueOnce(apiToken)
      .mockResolvedValueOnce({
        ...apiToken,
        environment: otherEnvironment,
      });
    environmentsRepository.findOneByOrFail.mockResolvedValue(otherEnvironment);
    apiTokensRepository.save.mockImplementation(async (entity) => entity);

    await service.update(
      5,
      { environmentId: 4 },
      actor,
    );

    expect(environmentsRepository.findOneByOrFail).toHaveBeenCalledWith({
      id: 4,
    });
    expect(apiTokensRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: otherEnvironment,
      }),
    );
  });

  it('regenerateSecret stores new hash and returns plainToken', async () => {
    const plainToken = 'ff_test_secret_token';
    jest.mocked(generateApiToken).mockReturnValue(plainToken);

    const apiToken = {
      id: 5,
      name: 'Token',
      isActive: true,
      environment,
      createdBy: actor,
      tokenHash: 'old-hash',
      tokenPrefix: 'ff_old…hash',
    };

    apiTokensRepository.findOneOrFail
      .mockResolvedValueOnce(apiToken)
      .mockResolvedValueOnce({
        ...apiToken,
        tokenPrefix: tokenPrefix(plainToken),
      });
    apiTokensRepository.save.mockImplementation(async (entity) => entity);

    const result = await service.regenerateSecret(5, actor);

    expect(apiTokensRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: hashApiToken(plainToken),
        tokenPrefix: tokenPrefix(plainToken),
      }),
    );
    expect(result.plainToken).toBe(plainToken);
    expect(auditService.logUpdateIf).toHaveBeenCalled();
  });

  it('remove logs audit delete', async () => {
    const apiToken = { id: 3, name: 'Token' };
    apiTokensRepository.findOne.mockResolvedValue(apiToken);

    await service.remove(3, actor);

    expect(auditService.logDeleteIf).toHaveBeenCalledWith(
      actor,
      'api_token',
      3,
      apiToken,
    );
    expect(apiTokensRepository.delete).toHaveBeenCalledWith(3);
  });
});
