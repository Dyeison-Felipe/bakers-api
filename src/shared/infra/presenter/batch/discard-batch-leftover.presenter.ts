import { ApiProperty } from '@nestjs/swagger';

export class DiscardBatchLeftoverPresenter {
  @ApiProperty({ description: 'Id do lote' })
  readonly id: string;

  @ApiProperty({ description: 'Quantidade baixada do lote' })
  readonly discardedQuantity: number;

  @ApiProperty({
    description: 'Se a sobra foi registrada como vendida pelo preço de custo',
  })
  readonly soldAtCost: boolean;

  @ApiProperty({
    description: 'Valor perdido com o descarte (null quando soldAtCost=true)',
    nullable: true,
  })
  readonly lossValue: number | null;

  @ApiProperty({
    description:
      'Valor recuperado vendendo pelo custo (null quando soldAtCost=false)',
    nullable: true,
  })
  readonly recoveredValue: number | null;
}
