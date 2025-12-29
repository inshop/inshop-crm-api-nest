export enum AppRole {
  CLIENT_CREATE = 'ROLE_CLIENT_CREATE',
  CLIENT_UPDATE = 'ROLE_CLIENT_UPDATE',
  CLIENT_LIST = 'ROLE_CLIENT_LIST',
  CLIENT_DETAILS = 'ROLE_CLIENT_DETAILS',
  CLIENT_DELETE = 'ROLE_CLIENT_DELETE',

  CONTACT_CREATE = 'ROLE_CONTACT_CREATE',
  CONTACT_UPDATE = 'ROLE_CONTACT_UPDATE',
  CONTACT_LIST = 'ROLE_CONTACT_LIST',
  CONTACT_DETAILS = 'ROLE_CONTACT_DETAILS',
  CONTACT_DELETE = 'ROLE_CONTACT_DELETE',

  USER_CREATE = 'ROLE_USER_CREATE',
  USER_UPDATE = 'ROLE_USER_UPDATE',
  USER_LIST = 'ROLE_USER_LIST',
  USER_DETAILS = 'ROLE_USER_DETAILS',
  USER_DELETE = 'ROLE_USER_DELETE',

  MODULE_CREATE = 'ROLE_MODULE_CREATE',
  MODULE_UPDATE = 'ROLE_MODULE_UPDATE',
  MODULE_LIST = 'ROLE_MODULE_LIST',
  MODULE_DETAILS = 'ROLE_MODULE_DETAILS',
  MODULE_DELETE = 'ROLE_MODULE_DELETE',

  GROUP_CREATE = 'ROLE_GROUP_CREATE',
  GROUP_UPDATE = 'ROLE_GROUP_UPDATE',
  GROUP_LIST = 'ROLE_GROUP_LIST',
  GROUP_DETAILS = 'ROLE_GROUP_DETAILS',
  GROUP_DELETE = 'ROLE_GROUP_DELETE',

  ROLE_CREATE = 'ROLE_ROLE_CREATE',
  ROLE_UPDATE = 'ROLE_ROLE_UPDATE',
  ROLE_LIST = 'ROLE_ROLE_LIST',
  ROLE_DETAILS = 'ROLE_ROLE_DETAILS',
  ROLE_DELETE = 'ROLE_ROLE_DELETE',
}

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
