import { ApiProperty } from '@nestjs/swagger';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class LeftoverBatchPresenter {
  @ApiProperty({ description: 'Id do lote' })
  readonly batchId: string;

  @ApiProperty({ description: 'Produto' })
  readonly product: { id: string; name: string; currentStock: number | null };

  @ApiProperty({ description: 'Unidade de medida', enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement;

  @ApiProperty({ description: 'Quantidade produzida no lote' })
  readonly producedQuantity: number;

  @ApiProperty({ description: 'Quantidade restante (sobra)' })
  readonly remainingQuantity: number;

  @ApiProperty({ description: 'Valor potencial de prejuízo se descartado' })
  readonly potentialLossValue: number;
}

export class FindTodayLeftoverBatchesPresenter {
  @ApiProperty({ description: 'Lotes de hoje com sobra', type: [LeftoverBatchPresenter] })
  readonly items: LeftoverBatchPresenter[];

  @ApiProperty({ description: 'Prejuízo potencial total do dia' })
  readonly totalPotentialLoss: number;
}
