import { Injectable } from '@nestjs/common';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../entities/client.entity';
import { Repository } from 'typeorm';
import { buildListWhere } from '../../core/utils/list-filters';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientsRepository.create(createClientDto);

    return this.clientsRepository.save(client);
  }

  findAll(take: number, skip: number, filter?: Record<string, string>) {
    return this.clientsRepository.findAndCount({
      take,
      skip,
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

  async update(id: number, updateClientDto: UpdateClientDto) {
    const client = await this.clientsRepository.findOneByOrFail({ id });
    const { password, id: _id, ...rest } = updateClientDto;
    Object.assign(client, rest);
    if (password) {
      client.password = password;
    }
    return this.clientsRepository.save(client);
  }

  remove(id: number) {
    return this.clientsRepository.delete(id);
  }
}
