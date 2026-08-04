import { ApiProperty } from '@nestjs/swagger';

export class CloseCashRegisterPresenter {
  @ApiProperty({ description: 'Id do caixa fechado' })
  readonly id: string;

  @ApiProperty({ description: 'Valor de abertura do caixa' })
  readonly openingAmount: number;

  @ApiProperty({ description: 'Total vendido em dinheiro nesta sessão' })
  readonly totalCash: number;

  @ApiProperty({ description: 'Total vendido em pix nesta sessão' })
  readonly totalPix: number;

  @ApiProperty({ description: 'Total vendido em cartão nesta sessão' })
  readonly totalCard: number;

  @ApiProperty({ description: 'Data/hora de fechamento' })
  readonly closedAt: Date;
}
