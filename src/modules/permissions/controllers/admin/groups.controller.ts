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
import { GroupsService } from '../../services/groups.service';
import { CreateGroupDto } from '../../dto/create-group.dto';
import { UpdateGroupDto } from '../../dto/update-group.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { Group } from '../../entities/group.entity';
import { TokenGuard } from '../../guards/token.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AppRole } from '../../constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(AppRole.GROUP_CREATE)
  create(@Body(ValidationPipe) createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get()
  @Roles(AppRole.GROUP_LIST)
  findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
  ) {
    return this.groupsService.findAll(take, skip);
  }

  @Get(':id')
  @Roles(AppRole.GROUP_DETAILS)
  findOne(@Param('id', ObjectPipe(Group, ['roles'])) group: Group) {
    return group;
  }

  @Patch(':id')
  @Roles(AppRole.GROUP_UPDATE)
  async update(
    @Param('id', ObjectPipe(Group)) group: Group,
    @Body(IdPipe, ValidationPipe) updateGroupDto: UpdateGroupDto,
  ) {
    await this.groupsService.update(group.id, updateGroupDto);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.GROUP_DELETE)
  async remove(@Param('id', ObjectPipe(Group)) group: Group) {
    await this.groupsService.remove(group.id);

    return;
  }
}
