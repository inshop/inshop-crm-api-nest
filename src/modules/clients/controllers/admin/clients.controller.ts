import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClientsService } from '../../services/clients.service';
import { CreateClientDto } from '../../dto/create-client.dto';
import { UpdateClientDto } from '../../dto/update-client.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { Client } from '../../entities/client.entity';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { TokenGuard } from '../../../permissions/guards/token.guard';
import { Roles } from '../../../permissions/decorators/roles.decorator';
import { RolesGuard } from '../../../permissions/guards/roles.guard';
import { AppRole } from '../../../permissions/constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(AppRole.CLIENT_CREATE)
  create(@Body(ValidationPipe) createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @Roles(AppRole.CLIENT_LIST)
  async findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
  ) {
    return this.clientsService.findAll(take, skip);
  }

  @Get(':id')
  @Roles(AppRole.CLIENT_DETAILS)
  findOne(@Param('id', ObjectPipe(Client)) client: Client) {
    return client;
  }

  @Patch(':id')
  @Roles(AppRole.CLIENT_UPDATE)
  async update(
    @Param('id', ObjectPipe(Client)) client: Client,
    @Body(IdPipe, ValidationPipe) updateClientDto: UpdateClientDto,
  ) {
    await this.clientsService.update(client.id, updateClientDto);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.CLIENT_DELETE)
  async remove(@Param('id', ObjectPipe(Client)) client: Client) {
    await this.clientsService.remove(client.id);

    return;
  }
}
