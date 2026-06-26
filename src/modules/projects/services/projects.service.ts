import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { Repository } from 'typeorm';
import { buildListWhere } from '../../core/utils/list-filters';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEntityType } from '../../audit/constants/audit.constants';
import { User } from '../../permissions/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private auditService: AuditService,
  ) {}

  async create(createProjectDto: CreateProjectDto, actor?: User) {
    const project = this.projectsRepository.create(createProjectDto);
    const saved = await this.projectsRepository.save(project);

    await this.auditService.logCreateIf(
      actor,
      AuditEntityType.PROJECT,
      saved.id,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    return this.projectsRepository.findAndCount({
      take,
      skip,
      order: { id: 'DESC' },
      where: buildListWhere<Project>(filter, {
        id: 'number',
        name: 'string',
        code: 'string',
        isActive: 'boolean',
      }),
    });
  }

  findOne(id: number) {
    return this.projectsRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, actor?: User) {
    const project = await this.projectsRepository.findOneByOrFail({ id });
    const before = { ...project } as unknown as Record<string, unknown>;
    const { id: _id, ...rest } = updateProjectDto;
    Object.assign(project, rest);
    const saved = await this.projectsRepository.save(project);

    await this.auditService.logUpdateIf(
      actor,
      AuditEntityType.PROJECT,
      id,
      before,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async remove(id: number, actor?: User) {
    const project = await this.projectsRepository.findOneBy({ id });

    await this.auditService.logDeleteIf(
      actor,
      AuditEntityType.PROJECT,
      id,
      project as unknown as Record<string, unknown>,
    );

    return this.projectsRepository.delete(id);
  }
}
