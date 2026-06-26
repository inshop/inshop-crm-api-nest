import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../dto/update-feature-flag.dto';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { FeatureFlagEnvironmentValue } from '../entities/feature-flag-environment-value.entity';
import { Project } from '../../projects/entities/project.entity';
import { Environment } from '../../environments/entities/environment.entity';
import { buildListWhere } from '../../core/utils/list-filters';
import { sanitizeForAudit } from '../../core/utils/audit-sanitize';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEntityType } from '../../audit/constants/audit.constants';
import { User } from '../../permissions/entities/user.entity';
import { FeatureFlagEnvironmentValueDto } from '../dto/feature-flag-environment-value.dto';

const FEATURE_FLAG_RELATIONS = {
  createdBy: true,
  projects: true,
  environmentValues: { environment: true },
} as const;

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag)
    private featureFlagsRepository: Repository<FeatureFlag>,
    @InjectRepository(FeatureFlagEnvironmentValue)
    private environmentValuesRepository: Repository<FeatureFlagEnvironmentValue>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Environment)
    private environmentsRepository: Repository<Environment>,
    private auditService: AuditService,
  ) {}

  private async resolveProjects(projectIds: number[]): Promise<Project[]> {
    if (!projectIds.length) {
      return [];
    }

    return this.projectsRepository.findBy({ id: In(projectIds) });
  }

  private async syncEnvironmentValues(
    featureFlag: FeatureFlag,
    environmentValues?: FeatureFlagEnvironmentValueDto[],
  ): Promise<void> {
    if (!environmentValues) {
      return;
    }

    for (const item of environmentValues) {
      const environment = await this.environmentsRepository.findOneByOrFail({
        id: item.environmentId,
      });

      let value = await this.environmentValuesRepository.findOne({
        where: {
          featureFlag: { id: featureFlag.id },
          environment: { id: environment.id },
        },
      });

      if (value) {
        value.enabled = item.enabled;
      } else {
        value = this.environmentValuesRepository.create({
          featureFlag,
          environment,
          enabled: item.enabled,
        });
      }

      await this.environmentValuesRepository.save(value);
    }
  }

  async create(createFeatureFlagDto: CreateFeatureFlagDto, actor?: User) {
    const { projectIds, environmentValues, expiresAt, ...rest } =
      createFeatureFlagDto;

    const featureFlag = this.featureFlagsRepository.create({
      ...rest,
      expiresAt: new Date(expiresAt),
      createdBy: actor,
      projects: await this.resolveProjects(projectIds),
    });

    const saved = await this.featureFlagsRepository.save(featureFlag);
    await this.syncEnvironmentValues(saved, environmentValues);

    const result = await this.findOne(saved.id);

    await this.auditService.logCreateIf(
      actor,
      AuditEntityType.FEATURE_FLAG,
      saved.id,
      result as unknown as Record<string, unknown>,
    );

    return result;
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    const { listFilter, envFilters } = this.splitFilter(filter);
    const where = this.buildFeatureFlagWhere(listFilter);
    const hasEnvFilters = Object.keys(envFilters).length > 0;

    if (!hasEnvFilters) {
      return this.featureFlagsRepository.findAndCount({
        take,
        skip,
        order: { id: 'DESC' },
        where,
        relations: FEATURE_FLAG_RELATIONS,
      });
    }

    const qb = this.createFeatureFlagListQueryBuilder();
    this.applyListFilterToQueryBuilder(qb, listFilter);
    this.applyEnvFiltersToQueryBuilder(qb, envFilters);

    return qb.take(take).skip(skip).getManyAndCount();
  }

  private splitFilter(filter?: Record<string, string>) {
    const listFilter: Record<string, string> = {};
    const envFilters: Record<string, string> = {};

    if (!filter) {
      return { listFilter, envFilters };
    }

    for (const [key, value] of Object.entries(filter)) {
      if (!value) {
        continue;
      }

      if (key.startsWith('env_')) {
        envFilters[key] = value;
      } else {
        listFilter[key] = value;
      }
    }

    return { listFilter, envFilters };
  }

  private buildFeatureFlagWhere(listFilter: Record<string, string>) {
    const where = buildListWhere<FeatureFlag>(
      listFilter,
      {
        id: 'number',
        name: 'string',
        code: 'string',
      },
      {
        projects: { id: 'number' },
        createdBy: { id: 'number' },
      },
    );

    if (listFilter.projectId) {
      where.projects = { id: Number(listFilter.projectId) };
    }

    if (listFilter.expiresAt) {
      const endOfDay = this.parseExpiresAtEndOfDay(listFilter.expiresAt);
      if (endOfDay) {
        where.expiresAt = LessThanOrEqual(endOfDay);
      }
    }

    return where;
  }

  private parseExpiresAtEndOfDay(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    return Number.isNaN(endOfDay.getTime()) ? null : endOfDay;
  }

  private createFeatureFlagListQueryBuilder() {
    return this.featureFlagsRepository
      .createQueryBuilder('flag')
      .leftJoinAndSelect('flag.createdBy', 'createdBy')
      .leftJoinAndSelect('flag.projects', 'projects')
      .leftJoinAndSelect('flag.environmentValues', 'environmentValues')
      .leftJoinAndSelect('environmentValues.environment', 'environment')
      .orderBy('flag.id', 'DESC');
  }

  private applyListFilterToQueryBuilder(
    qb: SelectQueryBuilder<FeatureFlag>,
    listFilter: Record<string, string>,
  ) {
    if (listFilter.id) {
      const id = Number(listFilter.id);
      if (!Number.isNaN(id)) {
        qb.andWhere('flag.id = :id', { id });
      }
    }

    if (listFilter.name) {
      qb.andWhere('flag.name ILIKE :name', { name: `%${listFilter.name}%` });
    }

    if (listFilter.code) {
      qb.andWhere('flag.code ILIKE :code', { code: `%${listFilter.code}%` });
    }

    if (listFilter.expiresAt) {
      const endOfDay = this.parseExpiresAtEndOfDay(listFilter.expiresAt);
      if (endOfDay) {
        qb.andWhere('flag.expiresAt <= :expiresAt', { expiresAt: endOfDay });
      }
    }

    if (listFilter.createdBy) {
      const createdById = Number(listFilter.createdBy);
      if (!Number.isNaN(createdById)) {
        qb.andWhere('createdBy.id = :createdById', { createdById });
      }
    }

    const projectId = listFilter.projectId ?? listFilter.projects;
    if (projectId) {
      const parsedProjectId = Number(projectId);
      if (!Number.isNaN(parsedProjectId)) {
        qb.andWhere('projects.id = :projectId', { projectId: parsedProjectId });
      }
    }
  }

  private applyEnvFiltersToQueryBuilder(
    qb: SelectQueryBuilder<FeatureFlag>,
    envFilters: Record<string, string>,
  ) {
    const evMetadata = this.environmentValuesRepository.metadata;
    const evTable = evMetadata.tableName;
    const flagFk =
      evMetadata.findColumnWithPropertyName('featureFlag')?.databaseName ??
      'featureFlagId';
    const envFk =
      evMetadata.findColumnWithPropertyName('environment')?.databaseName ??
      'environmentId';

    let index = 0;
    for (const [key, value] of Object.entries(envFilters)) {
      const match = /^env_(\d+)$/.exec(key);
      if (!match) {
        continue;
      }

      const envId = Number(match[1]);
      const envIdParam = `envFilterId${index}`;
      const existsClause = `EXISTS (SELECT 1 FROM ${evTable} ev WHERE ev."${flagFk}" = flag.id AND ev."${envFk}" = :${envIdParam} AND ev.enabled = true)`;

      if (value === 'true') {
        qb.andWhere(existsClause, { [envIdParam]: envId });
      } else if (value === 'false') {
        qb.andWhere(`NOT ${existsClause}`, { [envIdParam]: envId });
      }

      index += 1;
    }
  }

  findOne(id: number) {
    return this.featureFlagsRepository.findOneOrFail({
      where: { id },
      relations: FEATURE_FLAG_RELATIONS,
    });
  }

  async update(
    id: number,
    updateFeatureFlagDto: UpdateFeatureFlagDto,
    actor?: User,
  ) {
    const featureFlag = await this.featureFlagsRepository.findOneOrFail({
      where: { id },
      relations: FEATURE_FLAG_RELATIONS,
    });

    const before = sanitizeForAudit(
      featureFlag as unknown as Record<string, unknown>,
    );
    const {
      id: _id,
      projectIds,
      environmentValues,
      expiresAt,
      ...rest
    } = updateFeatureFlagDto;

    Object.assign(featureFlag, rest);

    if (expiresAt !== undefined) {
      featureFlag.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (projectIds !== undefined) {
      featureFlag.projects = await this.resolveProjects(projectIds);
    }

    await this.featureFlagsRepository.save(featureFlag);
    await this.syncEnvironmentValues(featureFlag, environmentValues);

    const saved = await this.findOne(id);

    await this.auditService.logUpdateIf(
      actor,
      AuditEntityType.FEATURE_FLAG,
      id,
      before,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async updateEnvironmentValue(
    featureFlagId: number,
    environmentId: number,
    enabled: boolean,
    actor?: User,
  ) {
    const featureFlag = await this.featureFlagsRepository.findOneByOrFail({
      id: featureFlagId,
    });
    const environment = await this.environmentsRepository.findOneByOrFail({
      id: environmentId,
    });

    let value = await this.environmentValuesRepository.findOne({
      where: {
        featureFlag: { id: featureFlagId },
        environment: { id: environmentId },
      },
      relations: { environment: true },
    });

    const beforeSnapshot = this.envValueAuditSnapshot(
      value?.environment ?? environment,
      value?.enabled ?? false,
    );

    if (value) {
      value.enabled = enabled;
    } else {
      value = this.environmentValuesRepository.create({
        featureFlag,
        environment,
        enabled,
      });
    }

    const saved = await this.environmentValuesRepository.save(value);

    await this.auditService.logUpdateIf(
      actor,
      AuditEntityType.FEATURE_FLAG,
      featureFlagId,
      beforeSnapshot,
      this.envValueAuditSnapshot(saved.environment ?? environment, saved.enabled),
    );

    return saved;
  }

  private envValueAuditSnapshot(
    environment: Environment,
    enabled: boolean,
  ): Record<string, unknown> {
    const label = environment.name ?? environment.code ?? String(environment.id);

    return {
      environmentValue: `${label}: ${enabled ? 'enabled' : 'disabled'}`,
    };
  }

  async remove(id: number, actor?: User) {
    const featureFlag = await this.featureFlagsRepository.findOne({
      where: { id },
      relations: FEATURE_FLAG_RELATIONS,
    });

    await this.auditService.logDeleteIf(
      actor,
      AuditEntityType.FEATURE_FLAG,
      id,
      featureFlag as unknown as Record<string, unknown>,
    );

    return this.featureFlagsRepository.delete(id);
  }

  async getClientBootstrap(projectId: number, environmentId: number) {
    const rows = await this.createClientFlagsQueryBuilder(projectId, environmentId)
      .select('flag.code', 'code')
      .getRawMany<{ code: string }>();

    const feature_flags: Record<string, boolean> = {};
    for (const row of rows) {
      feature_flags[row.code] = true;
    }

    return { feature_flags };
  }

  async getClientValue(code: string, projectId: number, environmentId: number) {
    const flag = await this.featureFlagsRepository.findOne({
      where: { code },
    });

    if (!flag) {
      throw new NotFoundException();
    }

    const active = await this.createClientFlagsQueryBuilder(projectId, environmentId)
      .andWhere('flag.code = :code', { code })
      .getOne();

    return { enabled: !!active };
  }

  private createClientFlagsQueryBuilder(projectId: number, environmentId: number) {
    return this.featureFlagsRepository
      .createQueryBuilder('flag')
      .innerJoin('flag.projects', 'project', 'project.id = :projectId', {
        projectId,
      })
      .innerJoin(
        'flag.environmentValues',
        'envValue',
        'envValue.enabled = true AND envValue.environmentId = :environmentId',
        { environmentId },
      )
      .andWhere('(flag.expiresAt IS NULL OR flag.expiresAt > :now)', {
        now: new Date(),
      });
  }
}
