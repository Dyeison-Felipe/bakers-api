import { ApiProperty } from '@nestjs/swagger';

export class RegisterManualStockMovementPresenter {
  @ApiProperty({ description: 'Id do produto movimentado' })
  readonly productId: string;

  @ApiProperty({ description: 'Estoque atual do produto após a movimentação' })
  readonly currentStock: number;
}
