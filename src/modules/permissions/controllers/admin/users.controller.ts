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
import { UsersService } from '../../services/users.service';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { IdPipe } from '../../../core/transformers/id.pipe';
import { ObjectPipe } from '../../../core/transformers/parse-object.pipe';
import { User } from '../../entities/user.entity';
import { TokenGuard } from '../../guards/token.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { AppRole } from '../../constants/roles.constants';

@UseGuards(TokenGuard, RolesGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(AppRole.USER_CREATE)
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(AppRole.USER_LIST)
  findAll(
    @Query('take', new DefaultValuePipe(30), new ParseIntPipe()) take: number,
    @Query('skip', new DefaultValuePipe(0), new ParseIntPipe()) skip: number,
  ) {
    return this.usersService.findAll(take, skip);
  }

  @Get(':id')
  @Roles(AppRole.USER_DETAILS)
  findOne(@Param('id', ObjectPipe(User, ['group'])) user: User) {
    return user;
  }

  @Patch(':id')
  @Roles(AppRole.USER_UPDATE)
  async update(
    @Param('id', ObjectPipe(User)) user: User,
    @Body(IdPipe, ValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    await this.usersService.update(user.id, updateUserDto);

    return;
  }

  @Delete(':id')
  @Roles(AppRole.USER_DELETE)
  async remove(@Param('id', ObjectPipe(User)) user: User) {
    await this.usersService.remove(user.id);

    return;
  }
}
