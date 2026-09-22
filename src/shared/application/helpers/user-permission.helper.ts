import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { isPermissionInPlan } from './plan-permission.helper';

type PermissionRef = { action: string; resource: string };

// Mesma regra do PermissionGuard (passo 6/7: Admin bypassa a checagem
// individual, os demais precisam ter a permissão em `userPermissions`) —
// extraída pra ser reutilizável em usecases que não passam pelo guard de rota
// (hoje só o Dashboard, que nunca deve devolver 403 e por isso decide
// internamente o que omitir).
export const hasUserPermission = (
  user: UserEntity,
  ref: PermissionRef,
): boolean =>
  user.role?.name === 'Admin' ||
  (user.userPermissions ?? []).some(
    (up) => up.permission.action === ref.action && up.permission.subject === ref.resource,
  );

// Permissão "de verdade" pro usuário logado: precisa estar tanto no plano da
// empresa quanto (se não for Admin) atribuída a ele. Usar isso em vez de só
// `isPermissionInPlan` é o que evita vazar dado de uma tela que o usuário
// individualmente não pode acessar, mesmo que o plano da empresa cubra.
export const isPermissionGranted = (
  user: UserEntity,
  ref: PermissionRef,
): boolean =>
  isPermissionInPlan(user.company.plan?.permissions, ref) &&
  hasUserPermission(user, ref);
