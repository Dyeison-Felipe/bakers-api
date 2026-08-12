import { ApiProperty } from '@nestjs/swagger';
import { CashRegisterSessionDetailPresenter } from '@/shared/infra/presenter/cash-register/cash-register-session-detail.presenter';

export class CashRegisterReportSummaryPresenter {
  @ApiProperty({ description: 'Quantidade de sessões de caixa no período' })
  readonly sessionsCount: number;

  @ApiProperty({ description: 'Soma dos valores de abertura' })
  readonly totalOpeningAmount: number;

  @ApiProperty({ description: 'Soma das vendas do período' })
  readonly totalSales: number;

  @ApiProperty({ description: 'Soma do custo dos itens vendidos' })
  readonly costOfSold: number;

  @ApiProperty({ description: 'Soma do custo de produção do período' })
  readonly totalProductionCost: number;

  @ApiProperty({ description: 'Soma das despesas do período' })
  readonly totalExpenses: number;

  @ApiProperty({ description: 'Soma do desperdício do período' })
  readonly totalWaste: number;

  @ApiProperty({ description: 'Soma recuperada com sobra vendida ao custo' })
  readonly totalRecoveredAtCost: number;

  @ApiProperty({ description: 'Soma dos suprimentos (incrementos) no período' })
  readonly totalSupplies: number;

  @ApiProperty({ description: 'Soma das sangrias (retiradas) no período' })
  readonly totalWithdrawals: number;

  @ApiProperty({ description: 'Soma do lucro do período' })
  readonly totalProfit: number;
}

export class CashRegisterReportPresenter {
  @ApiProperty({ type: CashRegisterReportSummaryPresenter })
  readonly summary: CashRegisterReportSummaryPresenter;

  @ApiProperty({
    description: 'Uma linha por sessão de caixa aberta/fechada no período',
    type: [CashRegisterSessionDetailPresenter],
  })
  readonly sessions: CashRegisterSessionDetailPresenter[];
}
