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
import { Request } from 'express';
import { ApiTokensService } from '../../services/api-tokens.service';
import { CreateApiTokenDto } from '../../dto/create-api-token.dto';
import { UpdateApiTokenDto } from '../../dto/update-api-token.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { BodyValidationPipe } from '../../../core/pipes/body-validation.pipe';
import { ParseFilterPipe } from '../../../core/pipes/parse-filter.pipe';
import { ApiToken } from '../../entities/api-token.entity';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { TokenGuard } from '../../../permissions/guards/token.guard';
import { Roles } from '../../../permissions/decorators/roles.decorator';
import { RolesGuard } from '../../../permissions/guards/roles.guard';
import { AppRole } from '../../../permissions/constants/roles.constants';
import { User } from '../../../permissions/entities/user.entity';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/api-tokens')
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}

  @Post()
  @Roles(AppRole.API_TOKEN_CREATE)
  create(
    @Req() req: Request & { user: User },
    @Body(BodyValidationPipe) createApiTokenDto: CreateApiTokenDto,
  ) {
    return this.apiTokensService.create(createApiTokenDto, req.user);
  }

  @Get()
  @Roles(AppRole.API_TOKEN_LIST)
  async findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
    @Query('filter', ParseFilterPipe) filter?: Record<string, string>,
  ) {
    return this.apiTokensService.findAll(take, skip, filter);
  }

  @Post(':id/regenerate')
  @Roles(AppRole.API_TOKEN_UPDATE)
  regenerate(
    @Req() req: Request & { user: User },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.apiTokensService.regenerateSecret(id, req.user);
  }

  @Get(':id')
  @Roles(AppRole.API_TOKEN_DETAILS)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.apiTokensService.findOne(id);
  }

  @Patch(':id')
  @Roles(AppRole.API_TOKEN_UPDATE)
  async update(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(ApiToken)) apiToken: ApiToken,
    @Body(IdPipe, BodyValidationPipe) updateApiTokenDto: UpdateApiTokenDto,
  ) {
    await this.apiTokensService.update(
      apiToken.id,
      updateApiTokenDto,
      req.user,
    );

    return;
  }

  @Delete(':id')
  @Roles(AppRole.API_TOKEN_DELETE)
  async remove(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(ApiToken)) apiToken: ApiToken,
  ) {
    await this.apiTokensService.remove(apiToken.id, req.user);

    return;
  }
}
