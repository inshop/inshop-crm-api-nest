import { AppRole } from './roles.constants';

export enum AppModuleName {
  CLIENTS = 'clients',
  CONTACTS = 'contacts',
  USERS = 'users',
  MODULES = 'modules',
  GROUPS = 'groups',
  ROLES = 'roles',
  AUTH = 'auth',
}

export const ModulesRolesMap: Record<AppModuleName, AppRole[]> = {
  [AppModuleName.CLIENTS]: [
    AppRole.CLIENT_CREATE,
    AppRole.CLIENT_UPDATE,
    AppRole.CLIENT_LIST,
    AppRole.CLIENT_DETAILS,
    AppRole.CLIENT_DELETE,
  ],
  [AppModuleName.CONTACTS]: [
    AppRole.CONTACT_CREATE,
    AppRole.CONTACT_UPDATE,
    AppRole.CONTACT_LIST,
    AppRole.CONTACT_DETAILS,
    AppRole.CONTACT_DELETE,
  ],
  [AppModuleName.USERS]: [
    AppRole.USER_CREATE,
    AppRole.USER_UPDATE,
    AppRole.USER_LIST,
    AppRole.USER_DETAILS,
    AppRole.USER_DELETE,
  ],
  [AppModuleName.MODULES]: [
    AppRole.MODULE_CREATE,
    AppRole.MODULE_UPDATE,
    AppRole.MODULE_LIST,
    AppRole.MODULE_DETAILS,
    AppRole.MODULE_DELETE,
  ],
  [AppModuleName.GROUPS]: [
    AppRole.GROUP_CREATE,
    AppRole.GROUP_UPDATE,
    AppRole.GROUP_LIST,
    AppRole.GROUP_DETAILS,
    AppRole.GROUP_DELETE,
  ],
  [AppModuleName.ROLES]: [
    AppRole.ROLE_CREATE,
    AppRole.ROLE_UPDATE,
    AppRole.ROLE_LIST,
    AppRole.ROLE_DETAILS,
    AppRole.ROLE_DELETE,
  ],
  [AppModuleName.AUTH]: [],
};

export function getRolesForModule(moduleName: AppModuleName): AppRole[] {
  return ModulesRolesMap[moduleName] || [];
}

export function allRoles(): AppRole[] {
  return Object.values(ModulesRolesMap).flat();
}
