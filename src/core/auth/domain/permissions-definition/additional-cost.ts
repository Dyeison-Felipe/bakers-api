// Separado de PermissionProduct de propósito: gastos adicionais (frete,
// embalagem etc.) é uma tela própria, mesmo que reutilize o cadastro de
// produto internamente.
export const PermissionAdditionalCost = {
  ADDITIONAL_COST_CREATE: {
    action: 'create',
    resource: 'additional_cost',
  },
  ADDITIONAL_COST_UPDATE: {
    action: 'update',
    resource: 'additional_cost',
  },
  ADDITIONAL_COST_DELETE: {
    action: 'delete',
    resource: 'additional_cost',
  },
  ADDITIONAL_COST_READER: {
    action: 'reader',
    resource: 'additional_cost',
  },
} as const;
