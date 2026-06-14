import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../entities/group.entity';
import { buildListWhere } from '../../core/utils/list-filters';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
  ) {}

  create(createGroupDto: CreateGroupDto) {
    const group = this.groupsRepository.create(createGroupDto);

    return this.groupsRepository.save(group);
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    return this.groupsRepository.findAndCount({
      take,
      skip,
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

  update(id: number, updateGroupDto: UpdateGroupDto) {
    return this.groupsRepository.save(updateGroupDto);
  }

  remove(id: number) {
    return this.groupsRepository.delete(id);
  }
}
