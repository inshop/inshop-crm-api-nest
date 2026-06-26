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
import { FeatureFlagsService } from '../../services/feature-flags.service';
import { CreateFeatureFlagDto } from '../../dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../../dto/update-feature-flag.dto';
import { UpdateFeatureFlagEnvironmentValueDto } from '../../dto/update-feature-flag-environment-value.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { BodyValidationPipe } from '../../../core/pipes/body-validation.pipe';
import { ParseFilterPipe } from '../../../core/pipes/parse-filter.pipe';
import { FeatureFlag } from '../../entities/feature-flag.entity';
import { Environment } from '../../../environments/entities/environment.entity';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { TokenGuard } from '../../../permissions/guards/token.guard';
import { Roles } from '../../../permissions/decorators/roles.decorator';
import { RolesGuard } from '../../../permissions/guards/roles.guard';
import { AppRole } from '../../../permissions/constants/roles.constants';
import { User } from '../../../permissions/entities/user.entity';
import { Request } from 'express';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Post()
  @Roles(AppRole.FEATURE_FLAG_CREATE)
  create(
    @Req() req: Request & { user: User },
    @Body(BodyValidationPipe) createFeatureFlagDto: CreateFeatureFlagDto,
  ) {
    return this.featureFlagsService.create(createFeatureFlagDto, req.user);
  }

  @Get()
  @Roles(AppRole.FEATURE_FLAG_LIST)
  async findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
    @Query('filter', ParseFilterPipe) filter?: Record<string, string>,
  ) {
    return this.featureFlagsService.findAll(take, skip, filter);
  }

  @Get(':id')
  @Roles(AppRole.FEATURE_FLAG_DETAILS)
  findOne(@Param('id', ObjectPipe(FeatureFlag)) featureFlag: FeatureFlag) {
    return this.featureFlagsService.findOne(featureFlag.id);
  }

  @Patch(':id')
  @Roles(AppRole.FEATURE_FLAG_UPDATE)
  async update(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(FeatureFlag)) featureFlag: FeatureFlag,
    @Body(IdPipe, BodyValidationPipe) updateFeatureFlagDto: UpdateFeatureFlagDto,
  ) {
    return this.featureFlagsService.update(
      featureFlag.id,
      updateFeatureFlagDto,
      req.user,
    );
  }

  @Patch(':id/environments/:environmentId')
  @Roles(AppRole.FEATURE_FLAG_UPDATE)
  updateEnvironmentValue(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(FeatureFlag)) featureFlag: FeatureFlag,
    @Param('environmentId', ObjectPipe(Environment)) environment: Environment,
    @Body(BodyValidationPipe)
    updateDto: UpdateFeatureFlagEnvironmentValueDto,
  ) {
    return this.featureFlagsService.updateEnvironmentValue(
      featureFlag.id,
      environment.id,
      updateDto.enabled,
      req.user,
    );
  }

  @Delete(':id')
  @Roles(AppRole.FEATURE_FLAG_DELETE)
  async remove(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(FeatureFlag)) featureFlag: FeatureFlag,
  ) {
    await this.featureFlagsService.remove(featureFlag.id, req.user);

    return;
  }
}
