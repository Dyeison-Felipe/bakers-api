import { ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardSummaryOutput } from '@/shared/application/output/dashboard/dashboard-summary.output';

export class DashboardSummaryPresenter {
  @ApiPropertyOptional({
    description:
      'Custo de produção planejado do dia — ausente se o usuário não tem acesso à Produção Diária',
  })
  readonly productionCostToday?: number;

  @ApiPropertyOptional({
    description:
      'Total recebido em dinheiro no dia — ausente se o usuário não tem acesso a PDV/Caixa',
  })
  readonly salesRevenueCashToday?: number;

  @ApiPropertyOptional({
    description:
      'Total recebido em Pix no dia — ausente se o usuário não tem acesso a PDV/Caixa',
  })
  readonly salesRevenuePixToday?: number;

  @ApiPropertyOptional({
    description:
      'Total recebido em cartão no dia — ausente se o usuário não tem acesso a PDV/Caixa',
  })
  readonly salesRevenueCardToday?: number;

  @ApiPropertyOptional({
    description:
      'Total de despesas lançadas no dia — ausente se o usuário não tem acesso a Despesas',
  })
  readonly expensesToday?: number;

  constructor(props: DashboardSummaryOutput) {
    this.productionCostToday = props.productionCostToday;
    this.salesRevenueCashToday = props.salesRevenueCashToday;
    this.salesRevenuePixToday = props.salesRevenuePixToday;
    this.salesRevenueCardToday = props.salesRevenueCardToday;
    this.expensesToday = props.expensesToday;
  }
}
