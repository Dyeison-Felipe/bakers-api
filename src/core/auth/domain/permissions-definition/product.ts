export const PermissionProduct = {
  PRODUCT_CREATE: {
    action: 'create',
    resource: 'product',
  },
  PRODUCT_UPDATE: {
    action: 'update',
    resource: 'product',
  },
  PRODUCT_DELETE: {
    action: 'delete',
    resource: 'product',
  },
  PRODUCT_READER: {
    action: 'reader',
    resource: 'product',
  },
} as const;
