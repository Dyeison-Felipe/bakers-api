import { ApiProperty } from '@nestjs/swagger';

export class CpvReportItemPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade vendida no período' })
  readonly quantitySold: number;

  @ApiProperty({ description: 'Receita gerada pelo produto no período' })
  readonly revenue: number;

  @ApiProperty({ description: 'Custo dos produtos vendidos (CPV) do produto no período' })
  readonly cpv: number;

  @ApiProperty({ description: 'Lucro bruto do produto (receita - CPV) no período' })
  readonly grossProfit: number;
}

export class CpvReportPresenter {
  @ApiProperty({ description: 'Receita total no período' })
  readonly totalRevenue: number;

  @ApiProperty({ description: 'CPV total no período' })
  readonly totalCpv: number;

  @ApiProperty({ description: 'Lucro bruto (receita - CPV) no período' })
  readonly grossProfit: number;

  @ApiProperty({ type: [CpvReportItemPresenter] })
  readonly items: CpvReportItemPresenter[];
}
