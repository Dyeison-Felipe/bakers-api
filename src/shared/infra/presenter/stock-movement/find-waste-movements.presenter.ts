import { ApiProperty } from '@nestjs/swagger';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeConsumptionUnit, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class WasteMovementItemPresenter {
  @ApiProperty({ description: 'Id do movimento' })
  readonly id: string;

  @ApiProperty({ description: 'Data do movimento' })
  readonly createdAt: Date;

  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade desperdiçada' })
  readonly quantity: number;

  @ApiProperty({
    description: 'Unidade de medida (venda) — nula para matéria-prima',
    enum: TypeUnitOfMeasurement,
    nullable: true,
  })
  readonly unitOfMeasurement: TypeUnitOfMeasurement | null;

  @ApiProperty({
    description: 'Unidade de consumo — usada quando não há unidade de venda',
    enum: TypeConsumptionUnit,
    nullable: true,
  })
  readonly consumerUnit: TypeConsumptionUnit | null;

  @ApiProperty({ description: 'Custo unitário no momento do movimento' })
  readonly unitCostSnapshot: number | null;

  @ApiProperty({ description: 'Valor total (quantidade x custo unitário)' })
  readonly totalCost: number;

  @ApiProperty({ description: 'Motivo do movimento', enum: TypeStockMovementReason })
  readonly reason: TypeStockMovementReason;

  @ApiProperty({ description: 'Descrição livre do motivo' })
  readonly reasonDescription: string | null;
}

export class FindWasteMovementsPresenter {
  @ApiProperty({ type: [WasteMovementItemPresenter] })
  readonly items: WasteMovementItemPresenter[];
}
