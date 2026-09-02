import { AddressOutput } from "../address/address.output";
import { PlanOutput } from "../plan/plan.output";

export type CreateCompanyOutput = {
  id: string;
  fantasyName: string;
  socialReazon: string;
  cnpj: string;
  email: string;
  phoneNumber: string;
  stateRegistration: string;
  plan: PlanOutput;
  address: AddressOutput;
  active: boolean;
  planStartedAt: Date;
  planExpiresAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
  // true quando o cadastro depende de confirmação de pagamento (assinatura
  // paga) — usuário ainda não consegue logar até o webhook confirmar.
  // Só é relevante logo após o cadastro (CreateCompanyUseCase); outros usos
  // deste output (find/update) não têm esse conceito e podem omitir.
  paymentPending?: boolean;
};
