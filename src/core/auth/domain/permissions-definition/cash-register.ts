export const PermissionCashRegister = {
  CASH_REGISTER_OPEN: {
    action: 'open',
    resource: 'cash_register',
  },
  CASH_REGISTER_CLOSE: {
    action: 'close',
    resource: 'cash_register',
  },
  CASH_REGISTER_READER: {
    action: 'reader',
    resource: 'cash_register',
  },
  CASH_REGISTER_MOVEMENT_CREATE: {
    action: 'movement_create',
    resource: 'cash_register',
  },
} as const;
