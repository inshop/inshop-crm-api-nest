import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { EnvironmentsService } from '../../services/environments.service';
import { CreateEnvironmentDto } from '../../dto/create-environment.dto';
import { UpdateEnvironmentDto } from '../../dto/update-environment.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { BodyValidationPipe } from '../../../core/pipes/body-validation.pipe';
import { ParseFilterPipe } from '../../../core/pipes/parse-filter.pipe';
import { Environment } from '../../entities/environment.entity';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { TokenGuard } from '../../../permissions/guards/token.guard';
import { Roles } from '../../../permissions/decorators/roles.decorator';
import { RolesGuard } from '../../../permissions/guards/roles.guard';
import { AppRole } from '../../../permissions/constants/roles.constants';
import { User } from '../../../permissions/entities/user.entity';
import { Request } from 'express';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/environments')
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Post()
  @Roles(AppRole.ENVIRONMENT_CREATE)
  create(
    @Req() req: Request & { user: User },
    @Body(BodyValidationPipe) createEnvironmentDto: CreateEnvironmentDto,
  ) {
    return this.environmentsService.create(createEnvironmentDto, req.user);
  }

  @Get()
  @Roles(AppRole.ENVIRONMENT_LIST)
  async findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
    @Query('filter', ParseFilterPipe) filter?: Record<string, string>,
  ) {
    return this.environmentsService.findAll(take, skip, filter);
  }

  @Get(':id')
  @Roles(AppRole.ENVIRONMENT_DETAILS)
  findOne(@Param('id', ObjectPipe(Environment)) environment: Environment) {
    return environment;
  }

  @Patch(':id')
  @Roles(AppRole.ENVIRONMENT_UPDATE)
  async update(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(Environment)) environment: Environment,
    @Body(IdPipe, BodyValidationPipe) updateEnvironmentDto: UpdateEnvironmentDto,
  ) {
    await this.environmentsService.update(
      environment.id,
      updateEnvironmentDto,
      req.user,
    );

    return;
  }

  @Delete(':id')
  @Roles(AppRole.ENVIRONMENT_DELETE)
  async remove(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(Environment)) environment: Environment,
  ) {
    await this.environmentsService.remove(environment.id, req.user);

    return;
  }
}
