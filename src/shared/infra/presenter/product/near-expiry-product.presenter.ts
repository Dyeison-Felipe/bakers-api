import { ApiProperty } from '@nestjs/swagger';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class NearExpiryProductPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly id: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly name: string;

  @ApiProperty({ description: 'Estoque atual' })
  readonly currentStock: number | null;

  @ApiProperty({ description: 'Unidade de medida', enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement | null;

  @ApiProperty({ description: 'Dias estimados até o vencimento (pode ser negativo se já vencido)' })
  readonly daysUntilExpiry: number;
}
