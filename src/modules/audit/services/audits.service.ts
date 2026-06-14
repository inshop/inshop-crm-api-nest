import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { buildListWhere } from '../../core/utils/list-filters';

@Injectable()
export class AuditsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    return this.auditLogRepository.findAndCount({
      take,
      skip,
      order: { id: 'DESC' },
      relations: { user: true },
      where: buildListWhere<AuditLog>(
        filter,
        {
          id: 'number',
          action: 'string',
          entityType: 'string',
          entityId: 'number',
        },
        { user: { name: 'string', email: 'string' } },
      ),
    });
  }
}
