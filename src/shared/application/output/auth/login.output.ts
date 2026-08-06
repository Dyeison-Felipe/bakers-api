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
}

export type LoginOutput = {
  user: FindByUserId;
  company: CompanyLoginOutput
  token: string;
};
