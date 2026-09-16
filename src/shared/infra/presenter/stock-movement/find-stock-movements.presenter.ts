import { ApiProperty } from '@nestjs/swagger';
import { TypeStockMovement, TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class StockMovementItemPresenter {
  @ApiProperty({ description: 'Id do movimento' })
  readonly id: string;

  @ApiProperty({ description: 'Data do movimento' })
  readonly createdAt: Date;

  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade movimentada' })
  readonly quantity: number;

  @ApiProperty({ description: 'Unidade de medida', enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement;

  @ApiProperty({ description: 'Custo unitário no momento do movimento' })
  readonly unitCostSnapshot: number | null;

  @ApiProperty({ description: 'Valor total (quantidade x custo unitário)' })
  readonly totalCost: number;

  @ApiProperty({ description: 'Tipo do movimento (entrada ou saída)', enum: TypeStockMovement })
  readonly type: TypeStockMovement;

  @ApiProperty({ description: 'Motivo do movimento', enum: TypeStockMovementReason })
  readonly reason: TypeStockMovementReason;

  @ApiProperty({ description: 'Descrição livre do motivo' })
  readonly reasonDescription: string | null;
}

export class FindStockMovementsPresenter {
  @ApiProperty({ type: [StockMovementItemPresenter] })
  readonly items: StockMovementItemPresenter[];
}
