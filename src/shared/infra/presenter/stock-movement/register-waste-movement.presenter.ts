import { ApiProperty } from '@nestjs/swagger';

export class RegisterWasteMovementPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Valor total perdido (quantidade x custo unitário)' })
  readonly totalCost: number;
}
