import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Module as ModuleEntity } from '../entities/module.entity';
import { Role } from '../entities/role.entity';
import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import {
  AppModuleName,
  ModulesRolesMap,
  allRoles,
} from '../constants/roles.constants';

@Injectable()
export class RolesSyncService {
  private readonly logger = new Logger(RolesSyncService.name);

  constructor(
    @InjectRepository(ModuleEntity)
    private modulesRepository: Repository<ModuleEntity>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async sync(): Promise<void> {
    this.logger.log('Starting roles/modules sync');

    for (const moduleKey of Object.values(AppModuleName)) {
      let module = await this.modulesRepository.findOne({
        where: { name: moduleKey },
      });

      if (!module) {
        module = this.modulesRepository.create({ name: moduleKey });
        module = await this.modulesRepository.save(module);
        this.logger.log(`Created module ${moduleKey}`);
      }

      const rolesForModule = ModulesRolesMap[moduleKey as AppModuleName] || [];

      for (const roleConst of rolesForModule) {
        let role = await this.rolesRepository.findOne({
          where: { role: roleConst },
        });

        if (!role) {
          role = this.rolesRepository.create({
            role: roleConst,
            name: roleConst,
            module,
          });
          await this.rolesRepository.save(role);
          this.logger.log(`Created role ${roleConst} in module ${moduleKey}`);
        } else if (!role.module || role.module.id !== module.id) {
          role.module = module;
          await this.rolesRepository.save(role);
          this.logger.log(`Updated role ${roleConst} module relation`);
        }
      }
    }

    const adminGroupName = 'admin';
    let adminGroup = await this.groupsRepository.findOne({
      where: { name: adminGroupName },
      relations: { roles: true },
    });

    const allRolesList = await this.rolesRepository.find({
      where: { role: In(allRoles()) },
    });

    if (!adminGroup) {
      adminGroup = this.groupsRepository.create({
        name: adminGroupName,
        roles: allRolesList,
      });
      adminGroup = await this.groupsRepository.save(adminGroup);
      this.logger.log('Created admin group with all roles');
    } else {
      const existingRoles = adminGroup.roles;
      const missing = allRolesList.filter(
        (r) => !existingRoles.some((ar) => ar.id === r.id),
      );
      if (missing.length > 0) {
        adminGroup.roles = [...existingRoles, ...missing];
        await this.groupsRepository.save(adminGroup);
        this.logger.log('Updated admin group with missing roles');
      }
    }

    if (!adminGroup) {
      throw new Error('Failed to create or load admin group');
    }

    const adminEmail = 'admin@admin.admin';
    const adminUser = await this.usersRepository.findOne({
      where: { email: adminEmail },
      relations: { group: true },
    });

    if (!adminUser) {
      const user = this.usersRepository.create({
        name: 'Administrator',
        email: adminEmail,
        password: adminEmail,
        group: adminGroup,
      });

      await this.usersRepository.save(user);
      this.logger.log('Created default admin user');
    } else if (!adminUser.group || adminUser.group.id !== adminGroup.id) {
      adminUser.group = adminGroup;
      await this.usersRepository.save(adminUser);
      this.logger.log('Updated default admin user group');
    }

    this.logger.log('Roles/modules sync finished');
  }
}
