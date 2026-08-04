import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export class ProductForSalePresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly id: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly name: string;

  @ApiPropertyOptional({ description: 'Código de barras' })
  readonly barCode: string | null;

  @ApiPropertyOptional({ enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement | null;

  @ApiPropertyOptional({ description: 'Valor de venda (unitário ou por kg)' })
  readonly salePrice: number | null;

  @ApiPropertyOptional({ description: 'Estoque atual' })
  readonly currentStock: number | null;

  @ApiProperty({ description: 'Se o produto controla estoque' })
  readonly stockManagement: boolean;

  @ApiPropertyOptional({ description: 'Caminho da imagem do produto' })
  readonly imagePath: string | null;
}
