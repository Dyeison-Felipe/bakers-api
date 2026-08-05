import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryPresenter {
  @ApiProperty({ description: 'Custo de produção planejado do dia' })
  readonly productionCostToday: number;

  @ApiProperty({ description: 'Total vendido no dia' })
  readonly salesRevenueToday: number;

  @ApiProperty({ description: 'Custo dos itens efetivamente vendidos no dia' })
  readonly costOfSoldToday: number;

  @ApiProperty({
    description: 'Lucro do dia: vendas − custo dos itens efetivamente vendidos',
  })
  readonly profitToday: number;
}
