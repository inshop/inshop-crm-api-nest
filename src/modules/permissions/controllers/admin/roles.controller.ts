import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RolesService } from '../../services/roles.service';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { Module } from '../../entities/module.entity';
import { TokenGuard } from '../../guards/token.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AppRole } from '../../constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/modules/:moduleId/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(AppRole.GROUP_CREATE, AppRole.GROUP_UPDATE)
  findAll(@Param('moduleId', ObjectPipe(Module)) module: Module) {
    return this.rolesService.findAll(module.id);
  }
}
