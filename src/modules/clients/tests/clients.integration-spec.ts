import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { ClientsService } from '../services/clients.service';
import { Client } from '../entities/client.entity';
import { ContactsService } from '../services/contacts.service';
import ContactType from '../types/contacts.type';
import { RolesSyncService } from '../../permissions/services/roles-sync.service';
import { truncateAllTables } from '../../../../test/helpers/db-cleanup';
import { isBcryptHash } from '../../core/utils/password';

describe('Clients integration', () => {
  let app: INestApplication;
  let clientsService: ClientsService;
  let contactsService: ContactsService;
  let clientsRepository: Repository<Client>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    clientsService = app.get(ClientsService);
    contactsService = app.get(ContactsService);
    clientsRepository = app.get(getRepositoryToken(Client));
    dataSource = app.get(DataSource);

    await app.get(RolesSyncService).sync();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
    await app.get(RolesSyncService).sync();
  });

  it('creates, reads, updates password, and deletes client', async () => {
    const created = await clientsService.create({
      name: 'Acme Corp',
      email: 'acme@example.com',
      password: 'client-password',
      isActive: true,
    });

    expect(created.id).toBeDefined();

    const [clients, total] = await clientsService.findAll(10, 0);
    expect(total).toBe(1);
    expect(clients[0].email).toBe('acme@example.com');

    const withContacts = await clientsService.findOne(created.id);
    expect(withContacts?.contacts).toEqual([]);

    await contactsService.create(created.id, {
      value: 'john@acme.com',
      type: ContactType.EMAIL,
    });

    const withRelation = await clientsService.findOne(created.id);
    expect(withRelation?.contacts).toHaveLength(1);

    await clientsService.update(created.id, {
      password: 'new-password',
    });

    const updated = await clientsRepository.findOneBy({ id: created.id });
    expect(isBcryptHash(updated!.password)).toBe(true);

    const contact = withRelation?.contacts[0];
    if (contact) {
      await contactsService.remove(contact.id);
    }

    await clientsService.remove(created.id);
    const deleted = await clientsService.findOne(created.id);
    expect(deleted).toBeNull();
  });
});
