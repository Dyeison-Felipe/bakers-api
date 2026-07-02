export const PermissionCategory= {
  CATEGORY_CREATE: {
    action: 'create',
    resource: 'category',
  },
  CATEGORY_UPDATE: {
    action: 'update',
    resource: 'category',
  },
  CATEGORY_DELETE: {
    action: 'delete',
    resource: 'category',
  },
  CATEGORY_READER: {
    action: 'reader',
    resource: 'category',
  },
} as const;
