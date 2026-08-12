import { ApiProperty } from '@nestjs/swagger';

export class ExpenseReportItemPresenter {
  @ApiProperty({ description: 'Id da despesa' })
  readonly id: string;

  @ApiProperty({ description: 'Data da despesa' })
  readonly date: Date;

  @ApiProperty({ description: 'Valor da despesa' })
  readonly value: number;

  @ApiProperty({ description: 'Descrição da despesa' })
  readonly description: string;
}

export class ExpenseReportDailyPointPresenter {
  @ApiProperty({ description: 'Dia (YYYY-MM-DD)' })
  readonly day: string;

  @ApiProperty({ description: 'Total de despesas no dia' })
  readonly total: number;
}

export class ExpenseReportPresenter {
  @ApiProperty({ description: 'Total de despesas no período' })
  readonly total: number;

  @ApiProperty({ type: [ExpenseReportDailyPointPresenter] })
  readonly dailySeries: ExpenseReportDailyPointPresenter[];

  @ApiProperty({ type: [ExpenseReportItemPresenter] })
  readonly items: ExpenseReportItemPresenter[];
}
