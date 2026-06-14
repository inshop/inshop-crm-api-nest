import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { buildListWhere } from '../../core/utils/list-filters';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEntityType } from '../../audit/constants/audit.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, actor?: User) {
    const user = this.usersRepository.create(createUserDto);
    const saved = await this.usersRepository.save(user);

    if (actor) {
      const withRelations = await this.usersRepository.findOne({
        where: { id: saved.id },
        relations: { group: true },
      });
      await this.auditService.logCreateIf(
        actor,
        AuditEntityType.USER,
        saved.id,
        (withRelations ?? saved) as unknown as Record<string, unknown>,
      );
    }

    return saved;
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    return this.usersRepository.findAndCount({
      take,
      skip,
      order: { id: 'DESC' },
      where: buildListWhere<User>(
        filter,
        {
          id: 'number',
          name: 'string',
          email: 'string',
          isActive: 'boolean',
        },
        { group: { name: 'string' } },
      ),
      relations: {
        group: true,
      },
    });
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: {
        group: true,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, actor?: User) {
    const user = await this.usersRepository.findOneOrFail({
      where: { id },
      relations: { group: true },
    });

    const before = { ...user } as unknown as Record<string, unknown>;
    const { password, id: _id, ...rest } = updateUserDto;
    Object.assign(user, rest);
    if (password) {
      user.password = password;
    }
    const saved = await this.usersRepository.save(user);

    if (actor) {
      const after = await this.usersRepository.findOne({
        where: { id },
        relations: { group: true },
      });
      await this.auditService.logUpdateIf(
        actor,
        AuditEntityType.USER,
        id,
        before,
        (after ?? saved) as unknown as Record<string, unknown>,
      );
    }

    return saved;
  }

  async remove(id: number, actor?: User) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { group: true },
    });

    await this.auditService.logDeleteIf(
      actor,
      AuditEntityType.USER,
      id,
      user as unknown as Record<string, unknown>,
    );

    return this.usersRepository.delete(id);
  }
}
