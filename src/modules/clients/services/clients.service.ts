import { Injectable } from '@nestjs/common';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../entities/client.entity';
import { Repository } from 'typeorm';
import { buildListWhere } from '../../core/utils/list-filters';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEntityType } from '../../audit/constants/audit.constants';
import { User } from '../../permissions/entities/user.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private auditService: AuditService,
  ) {}

  async create(createClientDto: CreateClientDto, actor?: User) {
    const client = this.clientsRepository.create(createClientDto);
    const saved = await this.clientsRepository.save(client);

    await this.auditService.logCreateIf(
      actor,
      AuditEntityType.CLIENT,
      saved.id,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    return this.clientsRepository.findAndCount({
      take,
      skip,
      order: { id: 'DESC' },
      where: buildListWhere<Client>(filter, {
        id: 'number',
        name: 'string',
        email: 'string',
        isActive: 'boolean',
      }),
    });
  }

  findOne(id: number) {
    return this.clientsRepository.findOne({
      where: { id },
      relations: {
        contacts: true,
      },
    });
  }

  async update(id: number, updateClientDto: UpdateClientDto, actor?: User) {
    const client = await this.clientsRepository.findOneByOrFail({ id });
    const before = { ...client } as unknown as Record<string, unknown>;
    const { password, id: _id, ...rest } = updateClientDto;
    Object.assign(client, rest);
    if (password) {
      client.password = password;
    }
    const saved = await this.clientsRepository.save(client);

    await this.auditService.logUpdateIf(
      actor,
      AuditEntityType.CLIENT,
      id,
      before,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async remove(id: number, actor?: User) {
    const client = await this.clientsRepository.findOneBy({ id });

    await this.auditService.logDeleteIf(
      actor,
      AuditEntityType.CLIENT,
      id,
      client as unknown as Record<string, unknown>,
    );

    return this.clientsRepository.delete(id);
  }
}
