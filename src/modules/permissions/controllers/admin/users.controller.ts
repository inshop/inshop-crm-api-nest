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
import { UsersService } from '../../services/users.service';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { BodyValidationPipe } from '../../../core/pipes/body-validation.pipe';
import { ParseFilterPipe } from '../../../core/pipes/parse-filter.pipe';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { User } from '../../entities/user.entity';
import { TokenGuard } from '../../guards/token.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AppRole } from '../../constants/roles.constants';
import { Request } from 'express';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(AppRole.USER_CREATE)
  create(
    @Req() req: Request & { user: User },
    @Body(BodyValidationPipe) createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Get()
  @Roles(AppRole.USER_LIST)
  findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
    @Query('filter', ParseFilterPipe) filter?: Record<string, string>,
  ) {
    return this.usersService.findAll(take, skip, filter);
  }

  @Get(':id')
  @Roles(AppRole.USER_DETAILS)
  findOne(@Param('id', ObjectPipe(User, ['group'])) user: User) {
    return user;
  }

  @Patch(':id')
  @Roles(AppRole.USER_UPDATE)
  async update(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(User)) user: User,
    @Body(IdPipe, BodyValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    await this.usersService.update(user.id, updateUserDto, req.user);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.USER_DELETE)
  async remove(
    @Req() req: Request & { user: User },
    @Param('id', ObjectPipe(User)) user: User,
  ) {
    await this.usersService.remove(user.id, req.user);

    return;
  }
}
