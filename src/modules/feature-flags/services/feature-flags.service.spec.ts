import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThanOrEqual } from 'typeorm';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { FeatureFlagEnvironmentValue } from '../entities/feature-flag-environment-value.entity';
import { Project } from '../../projects/entities/project.entity';
import { Environment } from '../../environments/entities/environment.entity';
import { AuditService } from '../../audit/services/audit.service';
import { User } from '../../permissions/entities/user.entity';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let auditService: { logUpdateIf: jest.Mock };
  let featureFlagsRepository: {
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    innerJoin: jest.Mock;
    orderBy: jest.Mock;
    andWhere: jest.Mock;
    select: jest.Mock;
    take: jest.Mock;
    skip: jest.Mock;
    getManyAndCount: jest.Mock;
    getRawMany: jest.Mock;
    getOne: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getRawMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
    };

    featureFlagsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: getRepositoryToken(FeatureFlag),
          useValue: featureFlagsRepository,
        },
        {
          provide: getRepositoryToken(FeatureFlagEnvironmentValue),
          useValue: {
            metadata: {
              tableName: 'feature_flag_environment_value',
              findColumnWithPropertyName: (name: string) => ({
                databaseName:
                  name === 'featureFlag' ? 'featureFlagId' : 'environmentId',
              }),
            },
          },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: { findBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Environment),
          useValue: { findOneByOrFail: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: {
            logCreateIf: jest.fn(),
            logUpdateIf: jest.fn(),
            logDeleteIf: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    auditService = module.get(AuditService);
  });

  describe('findAll', () => {
    it('uses findAndCount without env filters', async () => {
      await service.findAll(25, 0, {
        name: 'checkout',
        createdBy: '5',
        expiresAt: '2026-06-19',
        projectId: '3',
      });

      expect(featureFlagsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 0,
          where: expect.objectContaining({
            createdBy: { id: 5 },
            projects: { id: 3 },
            expiresAt: LessThanOrEqual(new Date(2026, 5, 19, 23, 59, 59, 999)),
          }),
        }),
      );
      expect(featureFlagsRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('uses query builder for env enabled filter', async () => {
      await service.findAll(10, 0, { env_1: 'true', name: 'foo' });

      expect(featureFlagsRepository.createQueryBuilder).toHaveBeenCalledWith(
        'flag',
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'flag.name ILIKE :name',
        { name: '%foo%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        { envFilterId0: 1 },
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.getManyAndCount).toHaveBeenCalled();
    });

    it('uses NOT EXISTS for env disabled filter', async () => {
      await service.findAll(10, 0, { env_2: 'false' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('NOT EXISTS'),
        { envFilterId0: 2 },
      );
    });

    it('combines multiple env filters with AND', async () => {
      await service.findAll(10, 0, { env_1: 'true', env_2: 'false' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        { envFilterId0: 1 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('NOT EXISTS'),
        { envFilterId1: 2 },
      );
    });
  });

  describe('update', () => {
    it('logs audit diff from pre-mutation snapshot when name changes', async () => {
      const actor = { id: 1, name: 'Admin' } as User;
      const featureFlag = {
        id: 5,
        name: 'Old name',
        code: 'old_code',
        expiresAt: new Date('2026-01-01'),
        createdBy: { id: 2, name: 'Creator' },
        projects: [{ id: 1, name: 'Project A' }],
        environmentValues: [],
      };

      featureFlagsRepository.findOneOrFail.mockResolvedValue(featureFlag);
      featureFlagsRepository.save.mockImplementation(async (entity) => entity);
      featureFlagsRepository.findOne.mockResolvedValue({
        ...featureFlag,
        name: 'New name',
      });

      await service.update(5, { name: 'New name' }, actor);

      expect(auditService.logUpdateIf).toHaveBeenCalledWith(
        actor,
        'feature_flag',
        5,
        expect.objectContaining({ name: 'Old name' }),
        expect.objectContaining({ name: 'New name' }),
      );
    });
  });

  describe('getClientBootstrap', () => {
    it('returns feature_flags map from active query rows', async () => {
      queryBuilder.getRawMany.mockResolvedValueOnce([
        { code: 'flag_a' },
        { code: 'flag_b' },
      ]);

      const result = await service.getClientBootstrap(1, 2);

      expect(result).toEqual({
        feature_flags: { flag_a: true, flag_b: true },
      });
      expect(queryBuilder.select).toHaveBeenCalledWith('flag.code', 'code');
    });
  });

  describe('getClientValue', () => {
    it('returns enabled true for active flag', async () => {
      featureFlagsRepository.findOne.mockResolvedValue({ id: 1, code: 'checkout' });
      queryBuilder.getOne.mockResolvedValueOnce({ id: 1, code: 'checkout' });

      await expect(service.getClientValue('checkout', 1, 2)).resolves.toEqual({
        enabled: true,
      });
    });

    it('returns enabled false when flag exists but is inactive', async () => {
      featureFlagsRepository.findOne.mockResolvedValue({ id: 1, code: 'checkout' });
      queryBuilder.getOne.mockResolvedValueOnce(null);

      await expect(service.getClientValue('checkout', 1, 2)).resolves.toEqual({
        enabled: false,
      });
    });

    it('throws NotFoundException for unknown code', async () => {
      featureFlagsRepository.findOne.mockResolvedValue(null);

      await expect(service.getClientValue('missing', 1, 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
