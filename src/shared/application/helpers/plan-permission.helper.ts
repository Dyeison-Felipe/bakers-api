import { Permission } from '@/core/permission/domain/entity/permission.entity';

type PermissionRef = { action: string; resource: string };

// Mesma checagem que o PermissionGuard já aplica (passo 5, "a permissão está
// inclusa no plano da empresa") — extraída pra ser reutilizável dentro de
// usecases que precisam decidir isso internamente (ex.: Dashboard/relatórios
// que devem omitir dados em vez de devolver 403 quando o módulo não está no
// plano da empresa).
export const isPermissionInPlan = (
  planPermissions: Permission[] | undefined,
  ref: PermissionRef,
): boolean =>
  (planPermissions ?? []).some(
    (p) => p.action === ref.action && p.subject === ref.resource,
  );
