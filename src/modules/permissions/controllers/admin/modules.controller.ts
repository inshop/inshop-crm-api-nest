import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ModulesService } from '../../services/modules.service';
import { CreateModuleDto } from '../../dto/create-module.dto';
import { UpdateModuleDto } from '../../dto/update-module.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { Module as ModuleEntity } from '../../../permissions/entities/module.entity';
import { TokenGuard } from '../../guards/token.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AppRole } from '../../constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @Roles(AppRole.MODULE_CREATE)
  create(@Body(ValidationPipe) createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Get()
  @Roles(AppRole.MODULE_LIST)
  findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
  ) {
    return this.modulesService.findAll(take, skip);
  }

  @Get(':id')
  @Roles(AppRole.MODULE_DETAILS)
  findOne(
    @Param('id', ObjectPipe(ModuleEntity, ['roles'])) module: ModuleEntity,
  ) {
    return module;
  }

  @Patch(':id')
  @Roles(AppRole.MODULE_UPDATE)
  async update(
    @Param('id', ObjectPipe(ModuleEntity)) module: ModuleEntity,
    @Body(IdPipe, ValidationPipe) updateModuleDto: UpdateModuleDto,
  ) {
    await this.modulesService.update(module.id, updateModuleDto);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.MODULE_DELETE)
  async remove(@Param('id', ObjectPipe(ModuleEntity)) module: ModuleEntity) {
    await this.modulesService.remove(module.id);

    return;
  }
}
