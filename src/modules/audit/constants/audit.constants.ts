export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum AuditEntityType {
  USER = 'user',
  GROUP = 'group',
  CLIENT = 'client',
  CONTACT = 'contact',
  AUTH = 'auth',
}
