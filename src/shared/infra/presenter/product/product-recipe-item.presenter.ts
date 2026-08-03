import { ApiProperty } from "@nestjs/swagger";
import { RecipeMaterialPresenter } from "./product-recipe-material.presenter";

export class ProductRecipeItemPresenter {
  @ApiProperty({ description: 'Identificador do item da receita' })
  readonly id: string;

  @ApiProperty({ description: 'Quantidade utilizada da matéria-prima' })
  readonly quantity: number;

  @ApiProperty({
    description: 'Matéria-prima vinculada ao item da receita',
    type: () => RecipeMaterialPresenter,
  })
  readonly material: RecipeMaterialPresenter;
}