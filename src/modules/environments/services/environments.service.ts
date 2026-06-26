import { Injectable } from '@nestjs/common';
import { CreateEnvironmentDto } from '../dto/create-environment.dto';
import { UpdateEnvironmentDto } from '../dto/update-environment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Environment } from '../entities/environment.entity';
import { Repository } from 'typeorm';
import { buildListWhere } from '../../core/utils/list-filters';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEntityType } from '../../audit/constants/audit.constants';
import { User } from '../../permissions/entities/user.entity';

@Injectable()
export class EnvironmentsService {
  constructor(
    @InjectRepository(Environment)
    private environmentsRepository: Repository<Environment>,
    private auditService: AuditService,
  ) {}

  async create(createEnvironmentDto: CreateEnvironmentDto, actor?: User) {
    const environment = this.environmentsRepository.create(createEnvironmentDto);
    const saved = await this.environmentsRepository.save(environment);

    await this.auditService.logCreateIf(
      actor,
      AuditEntityType.ENVIRONMENT,
      saved.id,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    return this.environmentsRepository.findAndCount({
      take,
      skip,
      order: { id: 'DESC' },
      where: buildListWhere<Environment>(filter, {
        id: 'number',
        name: 'string',
        code: 'string',
        isActive: 'boolean',
      }),
    });
  }

  findOne(id: number) {
    return this.environmentsRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: number,
    updateEnvironmentDto: UpdateEnvironmentDto,
    actor?: User,
  ) {
    const environment = await this.environmentsRepository.findOneByOrFail({
      id,
    });
    const before = { ...environment } as unknown as Record<string, unknown>;
    const { id: _id, ...rest } = updateEnvironmentDto;
    Object.assign(environment, rest);
    const saved = await this.environmentsRepository.save(environment);

    await this.auditService.logUpdateIf(
      actor,
      AuditEntityType.ENVIRONMENT,
      id,
      before,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async remove(id: number, actor?: User) {
    const environment = await this.environmentsRepository.findOneBy({ id });

    await this.auditService.logDeleteIf(
      actor,
      AuditEntityType.ENVIRONMENT,
      id,
      environment as unknown as Record<string, unknown>,
    );

    return this.environmentsRepository.delete(id);
  }
}
