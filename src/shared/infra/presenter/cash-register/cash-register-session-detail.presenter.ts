import { ApiProperty } from '@nestjs/swagger';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';

export class CashRegisterSessionDetailExpensePresenter {
  @ApiProperty({ description: 'Id da despesa' })
  readonly id: string;

  @ApiProperty({ description: 'Data da despesa' })
  readonly date: Date;

  @ApiProperty({ description: 'Valor da despesa' })
  readonly value: number;

  @ApiProperty({ description: 'Descrição da despesa' })
  readonly description: string;
}

export class CashRegisterSessionDetailPresenter {
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

  @ApiProperty({ description: 'Total vendido no dia da sessão' })
  readonly totalSales: number;

  @ApiProperty({ description: 'Custo dos itens efetivamente vendidos na sessão' })
  readonly costOfSold: number;

  @ApiProperty({ description: 'Custo de produção planejado do dia da sessão' })
  readonly productionCost: number;

  @ApiProperty({
    description: 'Despesas lançadas no dia da sessão',
    type: [CashRegisterSessionDetailExpensePresenter],
  })
  readonly expenses: CashRegisterSessionDetailExpensePresenter[];

  @ApiProperty({ description: 'Soma das despesas do dia da sessão' })
  readonly totalExpenses: number;

  @ApiProperty({
    description: 'Prejuízo com sobras descartadas (perda real) no dia da sessão',
  })
  readonly totalWaste: number;

  @ApiProperty({
    description:
      'Valor recuperado com sobras vendidas pelo preço de custo no dia da sessão (não é perda nem lucro)',
  })
  readonly totalRecoveredAtCost: number;

  @ApiProperty({ description: 'Total de incrementos (entradas) no caixa desta sessão' })
  readonly totalSupplies: number;

  @ApiProperty({ description: 'Total de sangrias (retiradas) no caixa desta sessão' })
  readonly totalWithdrawals: number;

  @ApiProperty({
    description:
      'Lucro do dia: vendas − custo dos itens efetivamente vendidos − despesas',
  })
  readonly profit: number;
}
