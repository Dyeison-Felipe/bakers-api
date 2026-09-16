import { ApiProperty } from '@nestjs/swagger';

export class AbcCurveReportItemPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade vendida no período' })
  readonly quantitySold: number;

  @ApiProperty({ description: 'Receita gerada pelo produto no período' })
  readonly revenue: number;

  @ApiProperty({ description: 'Percentual individual sobre a receita total' })
  readonly revenuePercent: number;

  @ApiProperty({ description: 'Percentual acumulado sobre a receita total' })
  readonly cumulativePercent: number;

  @ApiProperty({ description: 'Classificação ABC (A, B ou C)', enum: ['A', 'B', 'C'] })
  readonly classification: 'A' | 'B' | 'C';
}

export class AbcCurveReportPresenter {
  @ApiProperty({ description: 'Receita total no período' })
  readonly totalRevenue: number;

  @ApiProperty({ type: [AbcCurveReportItemPresenter] })
  readonly items: AbcCurveReportItemPresenter[];
}
