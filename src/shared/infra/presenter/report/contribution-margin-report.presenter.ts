import { ApiProperty } from '@nestjs/swagger';

export class ContributionMarginReportItemPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade vendida no período' })
  readonly quantitySold: number;

  @ApiProperty({ description: 'Receita gerada pelo produto no período' })
  readonly revenue: number;

  @ApiProperty({ description: 'Custo variável (CPV) do produto no período' })
  readonly variableCost: number;

  @ApiProperty({ description: 'Margem de contribuição (receita - custo variável)' })
  readonly contributionMargin: number;

  @ApiProperty({ description: 'Margem de contribuição em percentual da receita' })
  readonly contributionMarginPercent: number;
}

export class ContributionMarginReportPresenter {
  @ApiProperty({ description: 'Receita total no período' })
  readonly totalRevenue: number;

  @ApiProperty({ description: 'Custo variável total no período' })
  readonly totalVariableCost: number;

  @ApiProperty({ description: 'Margem de contribuição total no período' })
  readonly totalContributionMargin: number;

  @ApiProperty({ type: [ContributionMarginReportItemPresenter] })
  readonly items: ContributionMarginReportItemPresenter[];
}
