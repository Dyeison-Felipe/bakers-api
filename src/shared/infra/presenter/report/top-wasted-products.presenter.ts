import { ApiProperty } from '@nestjs/swagger';

export class TopWastedProductPointPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade total desperdiçada no período' })
  readonly quantity: number;

  @ApiProperty({ description: 'Valor total desperdiçado no período' })
  readonly totalCost: number;
}
