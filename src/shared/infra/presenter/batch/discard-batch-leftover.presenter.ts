import { ApiProperty } from '@nestjs/swagger';

export class DiscardBatchLeftoverPresenter {
  @ApiProperty({ description: 'Id do lote' })
  readonly id: string;

  @ApiProperty({ description: 'Quantidade descartada' })
  readonly discardedQuantity: number;

  @ApiProperty({ description: 'Valor perdido com o descarte' })
  readonly lossValue: number;
}
