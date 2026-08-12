import { ApiProperty } from '@nestjs/swagger';

export class PaymentMethodBreakdownPresenter {
  @ApiProperty({ description: 'Receita total em dinheiro no período' })
  readonly cash: number;

  @ApiProperty({ description: 'Receita total em Pix no período' })
  readonly pix: number;

  @ApiProperty({ description: 'Receita total em cartão no período' })
  readonly card: number;
}
