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
  PROJECT = 'project',
  ENVIRONMENT = 'environment',
  FEATURE_FLAG = 'feature_flag',
  AUTH = 'auth',
  API_TOKEN = 'api_token',
}
