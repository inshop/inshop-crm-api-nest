import {
  Controller,
  Get,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ModulesService } from '../../services/modules.service';
import { TokenGuard } from '../../guards/token.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AppRole } from '../../constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  @Roles(AppRole.GROUP_CREATE, AppRole.GROUP_UPDATE)
  findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
  ) {
    return this.modulesService.findAll(take, skip);
  }
}
