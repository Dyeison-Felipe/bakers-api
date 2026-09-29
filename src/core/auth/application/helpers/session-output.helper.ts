import { UserByLogin } from '@/core/user/application/queries/user.query';
import { SessionOutput } from '@/shared/application/output/auth/login.output';

type CompanyPlanState = {
  active: boolean;
  planExpiresAt: Date;
};

// Empresa sem acesso por plano: vencido (a data já passou, mesmo que o job da
// meia-noite ainda não tenha rodado) ou já desativada.
export const isCompanyPlanExpired = (company: CompanyPlanState): boolean =>
  !company.active || company.planExpiresAt.getTime() < Date.now();

// Dados de sessão devolvidos no login e na recarga da sessão (GET /session).
export const toSessionOutput = (user: UserByLogin): SessionOutput => ({
  user: {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: (user?.permissions ?? []).map((permission) => ({
      action: permission.action,
      subject: permission.subject,
    })),
  },
  company: {
    id: user.company.id,
    cnpj: user.company.cnpj,
    stateRegistration: user.company.stateRegistration,
    fantasyName: user.company.fantasyName,
    socialReazon: user.company.socialReazon,
    plan: {
      id: user.company.plan?.id ?? '',
      name: user.company.plan?.name ?? '',
      permissions: (user.company.plan?.permissions ?? []).map(
        (permission) => ({
          action: permission.action,
          subject: permission.subject,
        }),
      ),
    },
    // Super Admin não está vinculado a um plano de verdade.
    planExpired:
      user.role !== 'Super Admin' && isCompanyPlanExpired(user.company),
  },
});
