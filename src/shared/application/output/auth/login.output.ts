import { FindByUserId } from '../users/find-user-by-id.output';

type PlanPermissionOutput = {
  action: string;
  subject: string;
};

type CompanyLoginOutput = {
  id: string;
  cnpj: string;
  stateRegistration: string;
  fantasyName: string;
  socialReazon: string;
  plan: {
    id: string;
    name: string;
    permissions: PlanPermissionOutput[];
  };
  // Plano vencido: só o Admin chega a logar nesse estado, e só consegue usar
  // a tela de assinar um plano até pagar.
  planExpired: boolean;
}

export type LoginOutput = {
  user: FindByUserId;
  company: CompanyLoginOutput
  token: string;
};

// Mesmos dados do login, sem o token — pra recarregar a sessão atual.
export type SessionOutput = Omit<LoginOutput, 'token'>;
