import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';

export type FindAllCashRegisterSessionsItemOutput = {
  id: string;
  status: TypeCashRegisterSessionStatus;
  openingAmount: number;
  openedAt: Date;
  closedAt: Date | null;
  totalCash: number | null;
  totalPix: number | null;
  totalCard: number | null;
};
