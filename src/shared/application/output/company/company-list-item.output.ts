export type CompanyListItemOutput = {
  id: string;
  fantasyName: string;
  socialReazon: string;
  cnpj: string;
  email: string;
  phoneNumber: string;
  stateRegistration: string;
  active: boolean;
  planStartedAt: Date;
  planExpiresAt: Date;
  plan: {
    id: string;
    name: string;
    duration: number;
  } | null;
};
