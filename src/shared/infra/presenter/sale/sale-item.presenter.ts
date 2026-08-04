import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

class SaleItemProductPresenter {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly name: string;
}

export class SaleItemPresenter {
  @ApiProperty({ description: 'Id do item da venda' })
  readonly id: string;

  @ApiProperty({ type: () => SaleItemProductPresenter })
  readonly product: SaleItemProductPresenter;

  @ApiProperty({ enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement;

  @ApiPropertyOptional({ description: 'Quantidade vendida' })
  readonly quantity: number | null;

  @ApiPropertyOptional({ description: 'Peso vendido em kg' })
  readonly weightInKg: number | null;

  @ApiProperty({ description: 'Valor unitário/por kg no momento da venda' })
  readonly unitPriceSnapshot: number;

  @ApiProperty({ description: 'Subtotal do item' })
  readonly subtotal: number;
}
