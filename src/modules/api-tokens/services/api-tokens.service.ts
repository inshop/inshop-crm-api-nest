import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateApiTokenDto } from '../dto/create-api-token.dto';
import { UpdateApiTokenDto } from '../dto/update-api-token.dto';
import { ApiToken } from '../entities/api-token.entity';
import { Environment } from '../../environments/entities/environment.entity';
import { buildListWhere } from '../../core/utils/list-filters';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEntityType } from '../../audit/constants/audit.constants';
import { User } from '../../permissions/entities/user.entity';
import {
  generateApiToken,
  hashApiToken,
  tokenPrefix,
} from '../utils/token-hash';

const API_TOKEN_RELATIONS = {
  environment: true,
  createdBy: true,
} as const;

@Injectable()
export class ApiTokensService {
  constructor(
    @InjectRepository(ApiToken)
    private apiTokensRepository: Repository<ApiToken>,
    @InjectRepository(Environment)
    private environmentsRepository: Repository<Environment>,
    private auditService: AuditService,
  ) {}

  async create(createApiTokenDto: CreateApiTokenDto, actor?: User) {
    const { environmentId, ...rest } = createApiTokenDto;
    const plainToken = generateApiToken();

    const apiToken = this.apiTokensRepository.create({
      ...rest,
      tokenHash: hashApiToken(plainToken),
      tokenPrefix: tokenPrefix(plainToken),
      environment: await this.environmentsRepository.findOneByOrFail({
        id: environmentId,
      }),
      createdBy: actor,
    });

    const saved = await this.apiTokensRepository.save(apiToken);
    const result = await this.findOne(saved.id);

    await this.auditService.logCreateIf(
      actor,
      AuditEntityType.API_TOKEN,
      saved.id,
      result as unknown as Record<string, unknown>,
    );

    return { ...result, plainToken };
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    const where = buildListWhere<ApiToken>(
      filter,
      {
        id: 'number',
        name: 'string',
        isActive: 'boolean',
      },
      {
        environment: { id: 'number' },
      },
    );

    if (filter?.environmentId) {
      where.environment = { id: Number(filter.environmentId) };
    }

    return this.apiTokensRepository.findAndCount({
      take,
      skip,
      order: { id: 'DESC' },
      where,
      relations: API_TOKEN_RELATIONS,
    });
  }

  async findOne(id: number) {
    const apiToken = await this.apiTokensRepository.findOneOrFail({
      where: { id },
      relations: API_TOKEN_RELATIONS,
    });

    return this.toResponse(apiToken);
  }

  async regenerateSecret(id: number, actor?: User) {
    const apiToken = await this.apiTokensRepository.findOneOrFail({
      where: { id },
      relations: API_TOKEN_RELATIONS,
    });

    const before = { ...apiToken } as unknown as Record<string, unknown>;
    const plainToken = generateApiToken();

    apiToken.tokenHash = hashApiToken(plainToken);
    apiToken.tokenPrefix = tokenPrefix(plainToken);

    await this.apiTokensRepository.save(apiToken);
    const result = await this.findOne(id);

    await this.auditService.logUpdateIf(
      actor,
      AuditEntityType.API_TOKEN,
      id,
      before,
      result as unknown as Record<string, unknown>,
    );

    return { ...result, plainToken };
  }

  private toResponse(apiToken: ApiToken) {
    return {
      id: apiToken.id,
      name: apiToken.name,
      tokenPrefix: apiToken.tokenPrefix,
      environment: apiToken.environment,
      isActive: apiToken.isActive,
      createdBy: apiToken.createdBy,
      createdAt: apiToken.createdAt,
    };
  }

  findByTokenHash(tokenHash: string) {
    return this.apiTokensRepository.findOne({
      where: { tokenHash, isActive: true },
      relations: { environment: true },
    });
  }

  async update(id: number, updateApiTokenDto: UpdateApiTokenDto, actor?: User) {
    const apiToken = await this.apiTokensRepository.findOneOrFail({
      where: { id },
      relations: API_TOKEN_RELATIONS,
    });

    const before = { ...apiToken } as unknown as Record<string, unknown>;
    const { id: _id, environmentId, ...rest } = updateApiTokenDto;

    Object.assign(apiToken, rest);

    if (environmentId !== undefined) {
      apiToken.environment = await this.environmentsRepository.findOneByOrFail({
        id: environmentId,
      });
    }

    await this.apiTokensRepository.save(apiToken);
    const saved = await this.findOne(id);

    await this.auditService.logUpdateIf(
      actor,
      AuditEntityType.API_TOKEN,
      id,
      before,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async remove(id: number, actor?: User) {
    const apiToken = await this.apiTokensRepository.findOne({
      where: { id },
      relations: API_TOKEN_RELATIONS,
    });

    await this.auditService.logDeleteIf(
      actor,
      AuditEntityType.API_TOKEN,
      id,
      apiToken as unknown as Record<string, unknown>,
    );

    return this.apiTokensRepository.delete(id);
  }
}
