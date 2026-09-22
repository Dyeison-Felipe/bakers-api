export const PermissionDailyProduction = {
  DAILY_PRODUCTION_CREATE: {
    action: 'create',
    resource: 'daily_production',
  },
  DAILY_PRODUCTION_UPDATE: {
    action: 'update',
    resource: 'daily_production',
  },
  DAILY_PRODUCTION_DELETE: {
    action: 'delete',
    resource: 'daily_production',
  },
  DAILY_PRODUCTION_READER: {
    action: 'reader',
    resource: 'daily_production',
  },
  // Separado de UPDATE de propósito: marcar item como produzido é uma
  // execução do dia a dia (o operário de produção), diferente de
  // criar/editar o planejamento (UPDATE), que é decisão de quem monta a
  // produção do dia.
  DAILY_PRODUCTION_COMPLETE: {
    action: 'complete',
    resource: 'daily_production',
  },
  // Idem, separado de UPDATE: cancelar um item planejado é uma ação própria.
  DAILY_PRODUCTION_CANCEL: {
    action: 'cancel',
    resource: 'daily_production',
  },
} as const;
