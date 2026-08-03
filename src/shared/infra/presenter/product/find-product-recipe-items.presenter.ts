import { ApiProperty } from '@nestjs/swagger';
import { ProductRecipeItemPresenter } from './product-recipe-item.presenter';
import { ProductAdditionalCostPresenter } from './product-additional-cost.presenter';

export class FindProductRecipePresenter {
  @ApiProperty({
    description: 'Matérias-primas vinculadas à receita do produto',
    type: () => [ProductRecipeItemPresenter],
  })
  readonly recipeItems: ProductRecipeItemPresenter[];

  @ApiProperty({
    description: 'Custos adicionais vinculados ao produto',
    type: () => [ProductAdditionalCostPresenter],
  })
  readonly additionalCost: ProductAdditionalCostPresenter[];
}
