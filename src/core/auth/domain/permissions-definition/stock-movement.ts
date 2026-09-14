export const PermissionStockMovement = {
  STOCK_MOVEMENT_READER: {
    action: 'reader',
    resource: 'stock_movement',
  },
  STOCK_MOVEMENT_WRITE_OFF: {
    action: 'write_off',
    resource: 'stock_movement',
  },
} as const;
