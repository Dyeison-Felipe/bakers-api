export const PermissionUser = {
  USER_CREATE: {
    action: 'create',
    resource: 'user',
  },
  USER_UPDATE: {
    action: 'update',
    resource: 'user',
  },
  USER_DELETE: {
    action: 'delete',
    resource: 'user',
  },
  USER_READER: {
    action: 'reader',
    resource: 'user',
  },
} as const;
