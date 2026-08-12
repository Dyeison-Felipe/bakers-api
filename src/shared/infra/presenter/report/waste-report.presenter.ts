import { ApiProperty } from '@nestjs/swagger';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class WasteReportItemPresenter {
  @ApiProperty({ description: 'Id do movimento de lote' })
  readonly id: string;

  @ApiProperty({ description: 'Data do movimento' })
  readonly date: Date;

  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade descartada' })
  readonly quantity: number;

  @ApiProperty({ description: 'Unidade de medida', enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement;

  @ApiProperty({ description: 'Custo unitário no momento do movimento' })
  readonly unitCost: number | null;

  @ApiProperty({ description: 'Valor total (quantidade x custo unitário)' })
  readonly totalCost: number;

  @ApiProperty({ description: 'Motivo do movimento', enum: TypeBatchMovementReason })
  readonly reason: TypeBatchMovementReason;

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
