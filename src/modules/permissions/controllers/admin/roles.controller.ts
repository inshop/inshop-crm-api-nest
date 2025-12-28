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
import { RolesService } from '../../services/roles.service';
import { CreateRoleDto } from '../../dto/create-role.dto';
import { UpdateRoleDto } from '../../dto/update-role.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { Role } from '../../entities/role.entity';
import { Module } from '../../entities/module.entity';
import { TokenGuard } from '../../guards/token.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AppRole } from '../../constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/modules/:moduleId/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(AppRole.ROLE_CREATE)
  create(
    @Param('moduleId', ObjectPipe(Module)) module: Module,
    @Body(ValidationPipe) createRoleDto: CreateRoleDto,
  ) {
    return this.rolesService.create(module.id, createRoleDto);
  }

  @Get()
  @Roles(AppRole.ROLE_LIST)
  findAll(@Param('moduleId', ObjectPipe(Module)) module: Module) {
    return this.rolesService.findAll(module.id);
  }

  @Get(':id')
  @Roles(AppRole.ROLE_DETAILS)
  findOne(
    @Param('moduleId', ObjectPipe(Module)) module: Module,
    @Param('id', ObjectPipe(Role, ['module'])) role: Role,
  ) {
    if (role.module.id !== module.id) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  @Patch(':id')
  @Roles(AppRole.ROLE_UPDATE)
  async update(
    @Param('moduleId', ObjectPipe(Module)) module: Module,
    @Param('id', ObjectPipe(Role, ['module'])) role: Role,
    @Body(IdPipe, ValidationPipe) updateRoleDto: UpdateRoleDto,
  ) {
    if (role.module.id !== module.id) {
      throw new NotFoundException('Role not found');
    }

    await this.rolesService.update(role.id, updateRoleDto);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.ROLE_DELETE)
  async remove(
    @Param('moduleId', ObjectPipe(Module)) module: Module,
    @Param('id', ObjectPipe(Role, ['module'])) role: Role,
  ) {
    if (role.module.id !== module.id) {
      throw new NotFoundException('Role not found');
    }

    await this.rolesService.remove(role.id);

    return;
  }
}
