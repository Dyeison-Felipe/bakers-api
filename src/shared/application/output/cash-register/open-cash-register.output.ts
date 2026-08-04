import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';

export type OpenCashRegisterOutput = {
  id: string;
  status: TypeCashRegisterSessionStatus;
  openingAmount: number;
  openedAt: Date;
};
