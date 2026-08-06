export const PermissionRecipe = {
  RECIPE_CREATE: {
    action: 'create',
    resource: 'recipe',
  },
  RECIPE_UPDATE: {
    action: 'update',
    resource: 'recipe',
  },
  RECIPE_DELETE: {
    action: 'delete',
    resource: 'recipe',
  },
  RECIPE_READER: {
    action: 'reader',
    resource: 'recipe',
  },
} as const;
