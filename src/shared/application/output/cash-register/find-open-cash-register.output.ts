import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';

export type FindOpenCashRegisterOutput = {
  id: string;
  status: TypeCashRegisterSessionStatus;
  openingAmount: number;
  openedAt: Date;
  openedBy: string;
} | null;
