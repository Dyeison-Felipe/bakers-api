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
} as const;
