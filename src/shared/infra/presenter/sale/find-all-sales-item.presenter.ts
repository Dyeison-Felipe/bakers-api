import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypePaymentMethod, TypeSaleStatus } from '@/shared/infra/enums/sale';

export class FindAllSalesItemPresenter {
  @ApiProperty({ description: 'Id da venda' })
  readonly id: string;

  @ApiProperty({ enum: TypeSaleStatus })
  readonly status: TypeSaleStatus;

  @ApiProperty({ enum: TypePaymentMethod })
  readonly paymentMethod: TypePaymentMethod;

  @ApiProperty({ description: 'Valor total da venda' })
  readonly totalAmount: number;

  @ApiPropertyOptional({ description: 'CPF do cliente, se informado' })
  readonly customerCpf: string | null;

  @ApiProperty({ description: 'Data/hora da venda' })
  readonly createdAt: Date;
}
