import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { GroupsService } from '../../services/groups.service';
import { CreateGroupDto } from '../../dto/create-group.dto';
import { UpdateGroupDto } from '../../dto/update-group.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { BodyValidationPipe } from '../../../core/pipes/body-validation.pipe';
import { ParseFilterPipe } from '../../../core/pipes/parse-filter.pipe';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { Group } from '../../entities/group.entity';
import { User } from '../../entities/user.entity';
import { TokenGuard } from '../../guards/token.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AppRole } from '../../constants/roles.constants';
import { Request } from 'express';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(AppRole.GROUP_CREATE)
  create(
    @Req() req: Request & { user: User },
    @Body(BodyValidationPipe) createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.create(createGroupDto, req.user);
  }

  @Get()
  @Roles(AppRole.GROUP_LIST)
  findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
    @Query('filter', ParseFilterPipe) filter?: Record<string, string>,
  ) {
    return this.groupsService.findAll(take, skip, filter);
  }

  @Get(':id')
  @Roles(AppRole.GROUP_DETAILS)
  findOne(@Param('id', ObjectPipe(Group, ['roles'])) group: Group) {
    return group;
  }

  @Patch(':id')
  @Roles(AppRole.GROUP_UPDATE)
  async update(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(Group)) group: Group,
    @Body(IdPipe, BodyValidationPipe) updateGroupDto: UpdateGroupDto,
  ) {
    await this.groupsService.update(group.id, updateGroupDto, req.user);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.GROUP_DELETE)
  async remove(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(Group)) group: Group,
  ) {
    await this.groupsService.remove(group.id, req.user);

    return;
  }
}
