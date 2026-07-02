export const PermissionState = {
  STATE_CREATE: {
    action: 'create',
    resource: 'state',
  },
  STATE_UPDATE: {
    action: 'update',
    resource: 'state',
  },
  STATE_DELETE: {
    action: 'delete',
    resource: 'state',
  },
  STATE_READER: {
    action: 'reader',
    resource: 'state',
  },
} as const;
