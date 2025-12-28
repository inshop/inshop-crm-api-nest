import { Module } from '@nestjs/common';
import { RolesController } from './controllers/admin/roles.controller';
import { AuthController } from './controllers/admin/auth.controller';
import { GroupsController } from './controllers/admin/groups.controller';
import { ModulesController } from './controllers/admin/modules.controller';
import { UsersController } from './controllers/admin/users.controller';
import { AuthService } from './services/auth.service';
import { GroupsService } from './services/groups.service';
import { ModulesService } from './services/modules.service';
import { RolesService } from './services/roles.service';
import { UsersService } from './services/users.service';
import { UserTokenService } from './services/user-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { UserToken } from './entities/user-token.entity';
import { UserTokenCleanupService } from './services/user-token-cleanup.service';
import { RolesGuard } from './guards/roles.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, ModuleEntity, Role, User, UserToken]),
  ],
  controllers: [
    AuthController,
    GroupsController,
    ModulesController,
    RolesController,
    UsersController,
  ],
  providers: [
    AuthService,
    GroupsService,
    ModulesService,
    RolesService,
    UsersService,
    UserTokenService,
    UserTokenCleanupService,
    RolesGuard,
    Reflector,
  ],
  exports: [AuthService],
})
export class PermissionsModule {}
