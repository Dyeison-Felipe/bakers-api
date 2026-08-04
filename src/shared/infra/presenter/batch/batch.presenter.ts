import { ApiProperty } from '@nestjs/swagger';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

class BatchProductPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly id: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly name: string;
}

export class BatchPresenter {
  @ApiProperty({ description: 'Id do lote' })
  readonly id: string;

  @ApiProperty({ description: 'Produto do lote', type: () => BatchProductPresenter })
  readonly product: BatchProductPresenter;

  @ApiProperty({ description: 'Quantidade/peso inicial do lote' })
  readonly quantity: number;

  @ApiProperty({ description: 'Quantidade/peso restante do lote' })
  readonly remainingQuantity: number;

  @ApiProperty({ description: 'Unidade de medida', enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement;

  @ApiProperty({ description: 'Data de produção do lote' })
  readonly productionDate: Date;

  @ApiProperty({ description: 'Data de validade do lote' })
  readonly expirationDate: Date | null;

  @ApiProperty({ description: 'Id do item de produção diária de origem' })
  readonly dailyProductionItemId: string | null;

  @ApiProperty({ description: 'Data de criação do lote' })
  readonly createdAt: Date;
}
