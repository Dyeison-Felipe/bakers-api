import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryPresenter {
  @ApiProperty({ description: 'Custo de produção planejado do dia' })
  readonly productionCostToday: number;

  @ApiProperty({ description: 'Total recebido em dinheiro no dia' })
  readonly salesRevenueCashToday: number;

  @ApiProperty({ description: 'Total recebido em Pix no dia' })
  readonly salesRevenuePixToday: number;

  @ApiProperty({ description: 'Total recebido em cartão no dia' })
  readonly salesRevenueCardToday: number;

  @ApiProperty({ description: 'Total de despesas lançadas no dia' })
  readonly expensesToday: number;
}
