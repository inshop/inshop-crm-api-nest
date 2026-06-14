import { Injectable } from '@nestjs/common';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from '../entities/contact.entity';
import { Repository } from 'typeorm';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEntityType } from '../../audit/constants/audit.constants';
import { User } from '../../permissions/entities/user.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    private auditService: AuditService,
  ) {}

  async create(
    clientId: number,
    createContactDto: CreateContactDto,
    actor?: User,
  ) {
    const newContact = {
      ...createContactDto,
      client: clientId,
    } as unknown as Contact;

    const contact = this.contactRepository.create(newContact);
    const saved = await this.contactRepository.save(contact);

    await this.auditService.logCreateIf(
      actor,
      AuditEntityType.CONTACT,
      saved.id,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  findAll(clientId: number) {
    return this.contactRepository.find({
      where: { client: { id: clientId } },
      order: { id: 'DESC' },
    });
  }

  findOne(clientId: number, id: number): Promise<Contact | null> {
    return this.contactRepository.findOne({
      where: { id, client: { id: clientId } },
      relations: {
        client: true,
      },
    });
  }

  async update(
    id: number,
    updateContactDto: UpdateContactDto,
    actor?: User,
  ) {
    const contact = await this.contactRepository.findOne({
      where: { id },
      relations: { client: true },
    });
    if (!contact) {
      return this.contactRepository.update(id, updateContactDto);
    }

    const before = { ...contact } as unknown as Record<string, unknown>;
    Object.assign(contact, updateContactDto);
    const saved = await this.contactRepository.save(contact);

    await this.auditService.logUpdateIf(
      actor,
      AuditEntityType.CONTACT,
      id,
      before,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async remove(id: number, actor?: User) {
    const contact = await this.contactRepository.findOne({
      where: { id },
      relations: { client: true },
    });

    await this.auditService.logDeleteIf(
      actor,
      AuditEntityType.CONTACT,
      id,
      contact as unknown as Record<string, unknown>,
    );

    return this.contactRepository.delete(id);
  }
}
