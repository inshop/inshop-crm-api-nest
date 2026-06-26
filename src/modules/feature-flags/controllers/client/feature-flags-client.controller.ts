import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from '../../services/feature-flags.service';
import {
  ApiTokenGuard,
  ApiTokenRequest,
} from '../../../api-tokens/guards/api-token.guard';

@UseGuards(ApiTokenGuard)
@Controller('feature-flags')
export class FeatureFlagsClientController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get('bootstrap')
  bootstrap(@Req() req: ApiTokenRequest) {
    return this.featureFlagsService.getClientBootstrap(
      req.project.id,
      req.environment.id,
    );
  }

  @Get(':code')
  getValue(
    @Req() req: ApiTokenRequest,
    @Param('code') code: string,
    @Query('project') _project: string,
    @Query('environment') _environment: string,
  ) {
    return this.featureFlagsService.getClientValue(
      code,
      req.project.id,
      req.environment.id,
    );
  }
}
