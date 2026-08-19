export const PermissionCustomer = {
  CUSTOMER_CREATE: {
    action: 'create',
    resource: 'customer',
  },
  CUSTOMER_UPDATE: {
    action: 'update',
    resource: 'customer',
  },
  CUSTOMER_DELETE: {
    action: 'delete',
    resource: 'customer',
  },
  CUSTOMER_READER: {
    action: 'reader',
    resource: 'customer',
  },
} as const;
