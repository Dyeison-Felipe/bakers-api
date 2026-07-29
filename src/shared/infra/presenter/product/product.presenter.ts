import { ApiProperty } from '@nestjs/swagger';
import { CategoryPresenter } from '../category/category-presenter';
import {
  TypeProduct,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';

export class FindProductPresenter {
  @ApiProperty({ description: 'Identificador do produto' })
  readonly id: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly name: string;

  @ApiProperty({ description: 'Referência de escala' })
  readonly scaleReference: string | null;

  @ApiProperty({ description: 'Código de barras' })
  readonly barCode: string | null;

  @ApiProperty({ description: 'NCM do produto' })
  readonly ncm: string;

  @ApiProperty({ description: 'Preço de custo' })
  readonly costPrice: number;

  @ApiProperty({ description: 'Preço de venda' })
  readonly salePrice: number | null;

  @ApiProperty({ description: 'Preço de lucro' })
  readonly profitPrice: number | null;

  @ApiProperty({ description: 'Unidade de medida' })
  readonly unitOfMeasurement: TypeUnitOfMeasurement | null;

  @ApiProperty({ description: 'Unidade de compra', enum: TypeUnitOfPurchase })
  readonly purchaseUnit: TypeUnitOfPurchase | null;

  @ApiProperty({ description: 'Quantidade por unidade de compra' })
  readonly quantity: number | null;

  @ApiProperty({ description: 'Peso por unidade de compra' })
  readonly weight: number | null;

  @ApiProperty({ description: 'Volume por unidade de compra' })
  readonly volume: number | null;

  @ApiProperty({ description: 'Validade em dias' })
  readonly expirationDateInDays: string | null;

  @ApiProperty({ description: 'Gerencia estoque' })
  readonly stockManagement: boolean;

  @ApiProperty({ description: 'Peço por quilo do produto'})
  readonly pricePerKilogram: number | null;

  @ApiProperty({ description: 'Peço unitário do produto'})
  readonly unitCostPrice: number;

  @ApiProperty({ description: 'tipo do do produto'})
  readonly typeProduct: TypeProduct;

  @ApiProperty({ description: 'Estoque atual' })
  readonly currentStock: number | null;

  @ApiProperty({ description: 'Estoque mínimo' })
  readonly stockMin: number | null;

  @ApiProperty({ description: 'Produto ativo' })
  readonly active: boolean;

  @ApiProperty({ description: 'Descrição do produto' })
  readonly description: string | null;

  @ApiProperty({
    description: 'Categoria do produto',
    type: () => CategoryPresenter,
  })
  readonly category: CategoryPresenter;
}
