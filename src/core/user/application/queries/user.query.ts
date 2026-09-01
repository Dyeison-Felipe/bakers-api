export type Permissions = {
  id: string;
  action: string;
  subject: string;
  description: string;
};

export type UserByLogin = {
  id: string;
  username: string;
  password: string;
  email: string;
  active: boolean;
  emailVerified: boolean;
  activeSessionId: string | null;
  company: Company
  role: string;
  permissions?: Permissions[] | null;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  duration: number;
  permissions: Permissions[];
};

type Company = {
  id: string;
  cnpj: string;
  stateRegistration: string;
  fantasyName: string;
  socialReazon: string;
  active: boolean;
  planExpiresAt: Date;
  plan?: Plan;
};

export type UserGuard = {
  id: string;
  username: string;
  email: string;
  active: boolean;
  role: string;
  company: Company;
  permissions: Permissions[];
};

export interface UserQuery {
  findUserByEmail(email: string): Promise<UserByLogin | null>;
  findUserGuardBySub(sub: string): Promise<UserGuard | null>;
}
