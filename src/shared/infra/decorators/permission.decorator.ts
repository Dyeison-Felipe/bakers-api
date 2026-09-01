import { PermissionRef } from '@/core/auth/domain/permissions-definition/permissions';
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'PERMISSIONS';

export const IS_PUBLIC_KEY = 'IS_PUBLIC';

export const SUPER_ADMIN_ONLY_KEY = 'SUPER_ADMIN_ONLY';

export const ALLOW_SUPER_ADMIN_KEY = 'ALLOW_SUPER_ADMIN';

export const Permission = (...permissions: PermissionRef[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Restringe a rota a usuários com role.name === 'Super Admin', independente de
// permissão/plano da empresa — para recursos de plataforma (ex: gestão de
// planos), que não fazem sentido serem liberados via permissão contratada por
// uma empresa (uma empresa não deveria conseguir se auto-conceder acesso a
// gerenciar os planos de todo o sistema).
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);

// Diferente de SuperAdminOnly(): não restringe a rota ao Super Admin, apenas
// remove o bloqueio padrão que o guard aplica a ele. Para recursos que fazem
// sentido tanto pro fluxo normal (Admin/usuário) quanto pro Super Admin, como
// catálogos/listas de referência que não são sensíveis por empresa.
export const AllowSuperAdmin = () => SetMetadata(ALLOW_SUPER_ADMIN_KEY, true);
