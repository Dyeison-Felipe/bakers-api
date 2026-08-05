import { ApiProperty } from '@nestjs/swagger';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';

export class FindAllCashRegisterSessionsItemPresenter {
  @ApiProperty({ description: 'Id do caixa' })
  readonly id: string;

  @ApiProperty({ description: 'Status do caixa', enum: TypeCashRegisterSessionStatus })
  readonly status: TypeCashRegisterSessionStatus;

  @ApiProperty({ description: 'Valor de abertura do caixa' })
  readonly openingAmount: number;

  @ApiProperty({ description: 'Data/hora de abertura' })
  readonly openedAt: Date;

  @ApiProperty({ description: 'Data/hora de fechamento' })
  readonly closedAt: Date | null;

  @ApiProperty({ description: 'Total vendido em dinheiro nesta sessão' })
  readonly totalCash: number | null;

  @ApiProperty({ description: 'Total vendido em pix nesta sessão' })
  readonly totalPix: number | null;

  @ApiProperty({ description: 'Total vendido em cartão nesta sessão' })
  readonly totalCard: number | null;
}
