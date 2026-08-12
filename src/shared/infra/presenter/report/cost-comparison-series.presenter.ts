import { ApiProperty } from '@nestjs/swagger';

export class CostComparisonSeriesPointPresenter {
  @ApiProperty({ description: 'Dia (YYYY-MM-DD)' })
  readonly day: string;

  @ApiProperty({ description: 'Custo de produção no dia' })
  readonly productionCost: number;

  @ApiProperty({ description: 'Despesas no dia' })
  readonly expenses: number;

  @ApiProperty({ description: 'Desperdício no dia' })
  readonly waste: number;
}
