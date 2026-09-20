import { ApiProperty } from '@nestjs/swagger';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeConsumptionUnit, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class WasteReportItemPresenter {
  @ApiProperty({ description: 'Id do movimento' })
  readonly id: string;

  @ApiProperty({ description: 'Data do movimento' })
  readonly date: Date;

  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade descartada' })
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
  readonly unitCost: number | null;

  @ApiProperty({ description: 'Valor total (quantidade x custo unitário)' })
  readonly totalCost: number;

  @ApiProperty({ description: 'Motivo do movimento', enum: TypeStockMovementReason })
  readonly reason: TypeStockMovementReason;

  @ApiProperty({ description: 'Descrição livre do motivo' })
  readonly reasonDescription: string | null;
}

export class WasteReportDailyPointPresenter {
  @ApiProperty({ description: 'Dia (YYYY-MM-DD)' })
  readonly day: string;

  @ApiProperty({ description: 'Valor total desperdiçado no dia' })
  readonly total: number;
}

export class WasteReportProductPointPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade total desperdiçada' })
  readonly quantity: number;

  @ApiProperty({ description: 'Valor total desperdiçado' })
  readonly totalCost: number;
}

export class WasteReportPresenter {
  @ApiProperty({ description: 'Valor total desperdiçado no período' })
  readonly totalWaste: number;

  @ApiProperty({ description: 'Valor recuperado vendendo sobra ao custo' })
  readonly totalRecoveredAtCost: number;

  @ApiProperty({ type: [WasteReportDailyPointPresenter] })
  readonly dailySeries: WasteReportDailyPointPresenter[];

  @ApiProperty({ type: [WasteReportProductPointPresenter] })
  readonly byProduct: WasteReportProductPointPresenter[];

  @ApiProperty({ type: [WasteReportItemPresenter] })
  readonly wasteItems: WasteReportItemPresenter[];

  @ApiProperty({ type: [WasteReportItemPresenter] })
  readonly recoveredItems: WasteReportItemPresenter[];
}
