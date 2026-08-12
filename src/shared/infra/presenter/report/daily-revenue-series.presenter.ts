import { ApiProperty } from '@nestjs/swagger';

export class DailyRevenueSeriesPointPresenter {
  @ApiProperty({ description: 'Dia (YYYY-MM-DD)' })
  readonly day: string;

  @ApiProperty({ description: 'Receita em dinheiro no dia' })
  readonly cash: number;

  @ApiProperty({ description: 'Receita em Pix no dia' })
  readonly pix: number;

  @ApiProperty({ description: 'Receita em cartão no dia' })
  readonly card: number;

  @ApiProperty({ description: 'Receita total no dia' })
  readonly total: number;
}
