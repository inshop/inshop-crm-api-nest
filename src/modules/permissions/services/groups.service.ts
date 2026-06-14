import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import { buildListWhere } from '../../core/utils/list-filters';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEntityType } from '../../audit/constants/audit.constants';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    private auditService: AuditService,
  ) {}

  async create(createGroupDto: CreateGroupDto, actor?: User) {
    const group = this.groupsRepository.create(createGroupDto);
    const saved = await this.groupsRepository.save(group);

    if (actor) {
      const withRoles = await this.groupsRepository.findOne({
        where: { id: saved.id },
        relations: { roles: true },
      });
      await this.auditService.logCreateIf(
        actor,
        AuditEntityType.GROUP,
        saved.id,
        (withRoles ?? saved) as unknown as Record<string, unknown>,
      );
    }

    return saved;
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    return this.groupsRepository.findAndCount({
      take,
      skip,
      order: { id: 'DESC' },
      where: buildListWhere<Group>(filter, {
        id: 'number',
        name: 'string',
      }),
    });
  }

  findOne(id: number) {
    return this.groupsRepository.findOne({
      where: { id },
      relations: {
        roles: true,
      },
    });
  }

  async update(id: number, updateGroupDto: UpdateGroupDto, actor?: User) {
    const before = await this.groupsRepository.findOne({
      where: { id },
      relations: { roles: true },
    });

    const saved = await this.groupsRepository.save(updateGroupDto);

    if (actor && before) {
      const after = await this.groupsRepository.findOne({
        where: { id },
        relations: { roles: true },
      });
      await this.auditService.logUpdateIf(
        actor,
        AuditEntityType.GROUP,
        id,
        before as unknown as Record<string, unknown>,
        (after ?? saved) as unknown as Record<string, unknown>,
      );
    }

    return saved;
  }

  async remove(id: number, actor?: User) {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: { roles: true },
    });

    await this.auditService.logDeleteIf(
      actor,
      AuditEntityType.GROUP,
      id,
      group as unknown as Record<string, unknown>,
    );

    return this.groupsRepository.delete(id);
  }
}
