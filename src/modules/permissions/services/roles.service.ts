import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Contact } from '../../clients/entities/contact.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  create(moduleId: number, createRoleDto: CreateRoleDto) {
    const newRole = {
      ...createRoleDto,
      module: moduleId,
    } as unknown as Contact;

    const role = this.rolesRepository.create(newRole);

    return this.rolesRepository.save(role);
  }

  findAll(moduleId: number) {
    return this.rolesRepository.findBy({ module: { id: moduleId } });
  }

  findAllFlat(take: number, skip: number) {
    return this.rolesRepository.findAndCount({
      take,
      skip,
      order: { name: 'ASC' },
    });
  }

  findOne(moduleId: number, id: number) {
    return this.rolesRepository.findOne({
      where: { id, module: { id: moduleId } },
      relations: {
        module: true,
      },
    });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.rolesRepository.update(id, updateRoleDto);
  }

  remove(id: number) {
    return this.rolesRepository.delete(id);
  }
}
