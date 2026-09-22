export const PermissionStockMovement = {
  // Tela de Estoque (visão geral dos movimentos).
  STOCK_MOVEMENT_READER: {
    action: 'reader',
    resource: 'stock_movement',
  },
  STOCK_MOVEMENT_WRITE_OFF: {
    action: 'write_off',
    resource: 'stock_movement',
  },
  // Separado de READER de propósito: tela de Desperdício é uma feature
  // própria (registrar/consultar perdas), independente de ver o Estoque
  // como um todo.
  STOCK_MOVEMENT_WASTE_READER: {
    action: 'waste_reader',
    resource: 'stock_movement',
  },
} as const;
