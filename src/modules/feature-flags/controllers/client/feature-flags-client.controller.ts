import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlagsService } from '../../services/feature-flags.service';
import {
  ApiTokenGuard,
  ApiTokenRequest,
} from '../../../api-tokens/guards/api-token.guard';
import { Project } from '../../../projects/entities/project.entity';

@UseGuards(ApiTokenGuard)
@Controller('feature-flags')
export class FeatureFlagsClientController {
  constructor(
    private readonly featureFlagsService: FeatureFlagsService,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  @Get('bootstrap')
  async bootstrap(
    @Req() req: ApiTokenRequest,
    @Query('project') projectCode?: string,
  ) {
    const project = await this.resolveProject(projectCode);

    return this.featureFlagsService.getClientBootstrap(
      project.id,
      req.environment.id,
    );
  }

  @Get(':code')
  async getValue(
    @Req() req: ApiTokenRequest,
    @Param('code') code: string,
    @Query('project') projectCode?: string,
    @Query('environment') _environment?: string,
  ) {
    const project = await this.resolveProject(projectCode);

    return this.featureFlagsService.getClientValue(
      code,
      project.id,
      req.environment.id,
    );
  }

  private async resolveProject(projectCode?: string) {
    if (!projectCode) {
      throw new BadRequestException('project query param is required');
    }

    return this.projectsRepository.findOneByOrFail({ code: projectCode });
  }
}
