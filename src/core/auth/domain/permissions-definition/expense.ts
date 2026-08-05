export const PermissionExpense = {
  EXPENSE_CREATE: {
    action: 'create',
    resource: 'expense',
  },
  EXPENSE_UPDATE: {
    action: 'update',
    resource: 'expense',
  },
  EXPENSE_DELETE: {
    action: 'delete',
    resource: 'expense',
  },
  EXPENSE_READER: {
    action: 'reader',
    resource: 'expense',
  },
} as const;
