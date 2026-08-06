import { ApiProperty } from '@nestjs/swagger';

class RecipeItemMaterialPresenter {
  @ApiProperty() readonly id: string;
  @ApiProperty() readonly name: string;
  @ApiProperty({ nullable: true }) readonly imagePath: string | null;
  @ApiProperty({ nullable: true }) readonly consumerUnit: string | null;
  @ApiProperty() readonly unitCostPrice: number;
  @ApiProperty({ nullable: true }) readonly pricePerKilogram: number | null;
}

export class RecipeItemPresenter {
  @ApiProperty({ description: 'Id do item da receita' })
  readonly id: string;

  @ApiProperty({ description: 'Quantidade utilizada da matéria-prima' })
  readonly quantity: number;

  @ApiProperty({ type: () => RecipeItemMaterialPresenter })
  readonly material: RecipeItemMaterialPresenter;
}
