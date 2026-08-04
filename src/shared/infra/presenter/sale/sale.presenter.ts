import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypePaymentMethod, TypeSaleStatus } from '@/shared/infra/enums/sale';
import { SaleItemPresenter } from './sale-item.presenter';

export class SalePresenter {
  @ApiProperty({ description: 'Id da venda' })
  readonly id: string;

  @ApiProperty({ enum: TypeSaleStatus })
  readonly status: TypeSaleStatus;

  @ApiProperty({ enum: TypePaymentMethod })
  readonly paymentMethod: TypePaymentMethod;

  @ApiProperty({ description: 'Valor total da venda' })
  readonly totalAmount: number;

  @ApiPropertyOptional({ description: 'Valor recebido do cliente (se dinheiro)' })
  readonly amountReceived: number | null;

  @ApiPropertyOptional({ description: 'Troco devolvido (se dinheiro)' })
  readonly changeAmount: number | null;

  @ApiPropertyOptional({ description: 'CPF do cliente, se informado' })
  readonly customerCpf: string | null;

  @ApiProperty({ description: 'Se a venda possui cupom em PDF gerado' })
  readonly hasReceipt: boolean;

  @ApiProperty({ description: 'Id do usuário que realizou a venda' })
  readonly soldBy: string;

  @ApiProperty({ description: 'Data/hora da venda' })
  readonly createdAt: Date;

  @ApiProperty({ type: () => SaleItemPresenter, isArray: true })
  readonly items: SaleItemPresenter[];
}
