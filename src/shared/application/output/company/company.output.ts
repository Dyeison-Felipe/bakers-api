import { AddressOutput } from "../address/address.output";
import { PlanOutput } from "../plan/plan.output";

export type CompanyOutput = {
  id: string;
  fantasyName: string;
  socialReazon: string;
  cnpj: string;
  email: string;
  phoneNumber: string;
  stateRegistration: string
  plan: PlanOutput;
  address: AddressOutput;
  active: boolean;
  planStartedAt: Date;
  planExpiresAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};
