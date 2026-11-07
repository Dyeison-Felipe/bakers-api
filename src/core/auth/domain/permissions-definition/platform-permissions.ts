import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { PermissionPlan } from './plan';

/**
 * Recursos de plataforma: só o Super Admin os usa (as rotas deles são
 * `@SuperAdminOnly()`, não dependem de permissão). Não fazem sentido para os
 * usuários de uma empresa, então ficam fora da listagem de permissões vista
 * pelo Admin da empresa e não podem ser atribuídos a um usuário.
 */
export const PLATFORM_ONLY_RESOURCES: readonly string[] = [
  PermissionPlan.PLAN_READER.resource,
];

export const isPlatformOnlyResource = (resource: string): boolean =>
  PLATFORM_ONLY_RESOURCES.includes(resource);

/** Lança `BadRequestError` se o conjunto tiver alguma permissão de
 * plataforma — usado na criação/edição de usuários de empresa. */
export const ensureNoPlatformPermissions = (
  refs: { action: string; resource: string }[],
): void => {
  const platform = refs.filter((ref) => isPlatformOnlyResource(ref.resource));
  if (platform.length === 0) return;

  throw new BadRequestError(
    `Permissões exclusivas do administrador do sistema não podem ser atribuídas a usuários: ${platform
      .map((p) => `${p.resource}.${p.action}`)
      .join(', ')}`,
  );
};
