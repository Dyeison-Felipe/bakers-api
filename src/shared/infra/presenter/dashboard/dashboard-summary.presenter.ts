import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { DashboardSummaryOutput } from '@/shared/application/output/dashboard/dashboard-summary.output';

export class DashboardSummaryPresenter {
  @ApiProperty({ description: 'Custo de produção planejado do dia' })
  readonly productionCostToday: number;

  @ApiPropertyOptional({
    description:
      'Total recebido em dinheiro no dia — ausente se o plano não inclui PDV/Caixa',
  })
  readonly salesRevenueCashToday?: number;

  @ApiPropertyOptional({
    description:
      'Total recebido em Pix no dia — ausente se o plano não inclui PDV/Caixa',
  })
  readonly salesRevenuePixToday?: number;

  @ApiPropertyOptional({
    description:
      'Total recebido em cartão no dia — ausente se o plano não inclui PDV/Caixa',
  })
  readonly salesRevenueCardToday?: number;

  @ApiProperty({ description: 'Total de despesas lançadas no dia' })
  readonly expensesToday: number;

  constructor(props: DashboardSummaryOutput) {
    this.productionCostToday = props.productionCostToday;
    this.salesRevenueCashToday = props.salesRevenueCashToday;
    this.salesRevenuePixToday = props.salesRevenuePixToday;
    this.salesRevenueCardToday = props.salesRevenueCardToday;
    this.expensesToday = props.expensesToday;
  }
}
