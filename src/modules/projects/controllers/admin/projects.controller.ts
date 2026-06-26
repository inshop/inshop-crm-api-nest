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
import { ProjectsService } from '../../services/projects.service';
import { CreateProjectDto } from '../../dto/create-project.dto';
import { UpdateProjectDto } from '../../dto/update-project.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { BodyValidationPipe } from '../../../core/pipes/body-validation.pipe';
import { ParseFilterPipe } from '../../../core/pipes/parse-filter.pipe';
import { Project } from '../../entities/project.entity';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { TokenGuard } from '../../../permissions/guards/token.guard';
import { Roles } from '../../../permissions/decorators/roles.decorator';
import { RolesGuard } from '../../../permissions/guards/roles.guard';
import { AppRole } from '../../../permissions/constants/roles.constants';
import { User } from '../../../permissions/entities/user.entity';
import { Request } from 'express';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(AppRole.PROJECT_CREATE)
  create(
    @Req() req: Request & { user: User },
    @Body(BodyValidationPipe) createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @Get()
  @Roles(AppRole.PROJECT_LIST)
  async findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
    @Query('filter', ParseFilterPipe) filter?: Record<string, string>,
  ) {
    return this.projectsService.findAll(take, skip, filter);
  }

  @Get(':id')
  @Roles(AppRole.PROJECT_DETAILS)
  findOne(@Param('id', ObjectPipe(Project)) project: Project) {
    return project;
  }

  @Patch(':id')
  @Roles(AppRole.PROJECT_UPDATE)
  async update(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(Project)) project: Project,
    @Body(IdPipe, BodyValidationPipe) updateProjectDto: UpdateProjectDto,
  ) {
    await this.projectsService.update(project.id, updateProjectDto, req.user);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.PROJECT_DELETE)
  async remove(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(Project)) project: Project,
  ) {
    await this.projectsService.remove(project.id, req.user);

    return;
  }
}
