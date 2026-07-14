import { ApiProperty } from "@nestjs/swagger";
import { CategoryPresenter } from "../category/category-presenter";

export class FindAllProductPresenter {

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
  readonly salePrice: number;

  @ApiProperty({ description: 'Preço de lucro' })
  readonly profitPrice: number;

  @ApiProperty({ description: 'Unidade de medida' })
  readonly unitOfMeasurement: string;

  @ApiProperty({ description: 'Validade em dias' })
  readonly expirationDateInDays: string | null;

  @ApiProperty({ description: 'Gerencia estoque' })
  readonly stockManagement: boolean;

  @ApiProperty({ description: 'Produto de revenda' })
  readonly resale: boolean;

  @ApiProperty({ description: 'Matéria-prima' })
  readonly rowMaterial: boolean;

  @ApiProperty({ description: 'Produção própria' })
  readonly ownProduction: boolean;

  @ApiProperty({ description: 'Matéria-prima de revenda' })
  readonly rowMaterialResale: boolean;

  @ApiProperty({ description: 'Estoque atual' })
  readonly currentStock: number | null;

  @ApiProperty({ description: 'Estoque mínimo' })
  readonly stockMin: number | null;

  @ApiProperty({ description: 'Produto ativo' })
  readonly active: boolean;

  @ApiProperty({ description: 'Descrição do produto' })
  readonly description: string | null;

  @ApiProperty({ description: 'Categoria do produto', type: () => CategoryPresenter })
  readonly category: CategoryPresenter;
}