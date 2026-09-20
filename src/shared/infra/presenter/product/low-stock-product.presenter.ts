import { ApiProperty } from '@nestjs/swagger';
import { TypeConsumptionUnit, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class LowStockProductPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly id: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly name: string;

  @ApiProperty({ description: 'Estoque atual' })
  readonly currentStock: number | null;

  @ApiProperty({ description: 'Estoque mínimo' })
  readonly stockMin: number | null;

  @ApiProperty({ description: 'Unidade de medida', enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement | null;

  @ApiProperty({
    description: 'Unidade de consumo — usada quando não há unidade de venda',
    enum: TypeConsumptionUnit,
    nullable: true,
  })
  readonly consumerUnit: TypeConsumptionUnit | null;
}
