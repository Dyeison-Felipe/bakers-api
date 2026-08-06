import { PermissionRef } from '@/core/auth/domain/permissions-definition/permissions';
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'PERMISSIONS';

export const IS_PUBLIC_KEY = 'IS_PUBLIC';

export const SUPER_ADMIN_ONLY_KEY = 'SUPER_ADMIN_ONLY';

export const Permission = (...permissions: PermissionRef[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Restringe a rota a usuários com role.name === 'Super Admin', independente de
// permissão/plano da empresa — para recursos de plataforma (ex: gestão de
// planos), que não fazem sentido serem liberados via permissão contratada por
// uma empresa (uma empresa não deveria conseguir se auto-conceder acesso a
// gerenciar os planos de todo o sistema).
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);
