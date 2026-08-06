import { ApiProperty } from '@nestjs/swagger';

class RecipeLinkRecipePresenter {
  @ApiProperty() readonly id: string;
  @ApiProperty() readonly name: string;
  @ApiProperty() readonly costPrice: number;
}

export class ProductRecipeLinkPresenter {
  @ApiProperty({ description: 'Identificador do vínculo produto-receita' })
  readonly id: string;

  @ApiProperty({
    description: 'Receita reutilizável vinculada',
    type: () => RecipeLinkRecipePresenter,
  })
  readonly recipe: RecipeLinkRecipePresenter;
}
