import { TypePaymentMethod, TypeSaleStatus } from '@/shared/infra/enums/sale';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type SaleItemOutput = {
  id: string;
  product: {
    id: string;
    name: string;
  };
  unitOfMeasurement: TypeUnitOfMeasurement;
  quantity: number | null;
  weightInKg: number | null;
  unitPriceSnapshot: number;
  subtotal: number;
};

export type SaleOutput = {
  id: string;
  status: TypeSaleStatus;
  paymentMethod: TypePaymentMethod;
  totalAmount: number;
  amountReceived: number | null;
  changeAmount: number | null;
  customerCpf: string | null;
  hasReceipt: boolean;
  soldBy: string;
  createdAt: Date;
  items: SaleItemOutput[];
};

export type FindAllSalesItemOutput = {
  id: string;
  status: TypeSaleStatus;
  paymentMethod: TypePaymentMethod;
  totalAmount: number;
  createdAt: Date;
};
