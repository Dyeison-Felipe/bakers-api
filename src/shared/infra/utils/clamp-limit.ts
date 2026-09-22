// shared/infra/utils/clamp-limit.ts
// Os controllers de listagem recebem `limit` cru de `@Query`, então o
// `@Max` do PaginationDto não é aplicado. Este teto evita que um cliente
// (ou um bug de front) peça a tabela inteira de uma vez.
export const MAX_PAGE_LIMIT = 500;

export const clampLimit = (limit?: string | number | null): number | undefined => {
  if (limit === undefined || limit === null || limit === '') return undefined;

  const parsed = Number(limit);

  if (!Number.isFinite(parsed) || parsed < 1) return undefined;

  return Math.min(Math.floor(parsed), MAX_PAGE_LIMIT);
};
