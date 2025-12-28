import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from '../../services/contacts.service';
import { CreateContactDto } from '../../dto/create-contact.dto';
import { UpdateContactDto } from '../../dto/update-contact.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { Client } from '../../entities/client.entity';
import { Contact } from '../../entities/contact.entity';
import { TokenGuard } from '../../../permissions/guards/token.guard';
import { Roles } from '../../../permissions/decorators/roles.decorator';
import { RolesGuard } from '../../../permissions/guards/roles.guard';
import { AppRole } from '../../../permissions/constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/clients/:clientId/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Roles(AppRole.CONTACT_CREATE)
  create(
    @Param('clientId', ObjectPipe(Client)) client: Client,
    @Body(ValidationPipe) createContactDto: CreateContactDto,
  ) {
    return this.contactsService.create(client.id, createContactDto);
  }

  @Get()
  @Roles(AppRole.CONTACT_LIST)
  findAll(@Param('clientId', ObjectPipe(Client)) client: Client) {
    return this.contactsService.findAll(client.id);
  }

  @Get(':id')
  @Roles(AppRole.CONTACT_DETAILS)
  findOne(
    @Param('clientId', ObjectPipe(Client)) client: Client,
    @Param('id', ObjectPipe(Contact, ['client'])) contact: Contact,
  ) {
    if (contact.client.id !== client.id) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  @Patch(':id')
  @Roles(AppRole.CONTACT_UPDATE)
  async update(
    @Param('clientId', ObjectPipe(Client)) client: Client,
    @Param('id', ObjectPipe(Contact, ['client'])) contact: Contact,
    @Body(IdPipe, ValidationPipe) updateContactDto: UpdateContactDto,
  ) {
    if (contact.client.id !== client.id) {
      throw new NotFoundException('Contact not found');
    }

    await this.contactsService.update(contact.id, updateContactDto);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.CONTACT_DELETE)
  async remove(
    @Param('clientId', ObjectPipe(Client)) client: Client,
    @Param('id', ObjectPipe(Contact, ['client'])) contact: Contact,
  ) {
    if (contact.client.id !== client.id) {
      throw new NotFoundException('Contact not found');
    }

    await this.contactsService.remove(contact.id);

    return;
  }
}
