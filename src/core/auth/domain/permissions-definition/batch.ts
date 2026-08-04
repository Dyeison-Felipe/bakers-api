export const PermissionBatch = {
  BATCH_READER: {
    action: 'reader',
    resource: 'batch',
  },
  BATCH_UPDATE: {
    action: 'update',
    resource: 'batch',
  },
  BATCH_DELETE: {
    action: 'delete',
    resource: 'batch',
  },
  BATCH_WRITE_OFF: {
    action: 'write_off',
    resource: 'batch',
  },
} as const;
