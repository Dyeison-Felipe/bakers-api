import { ApiProperty } from '@nestjs/swagger';
import { ProductAdditionalCostPresenter } from './product-additional-cost.presenter';
import { ProductRecipeLinkPresenter } from './product-recipe-link.presenter';

export class FindProductRecipePresenter {
  @ApiProperty({
    description: 'Custos adicionais vinculados ao produto',
    type: () => [ProductAdditionalCostPresenter],
  })
  readonly additionalCost: ProductAdditionalCostPresenter[];

  @ApiProperty({
    description: 'Receitas-base reutilizáveis vinculadas ao produto',
    type: () => [ProductRecipeLinkPresenter],
  })
  readonly recipeLinks: ProductRecipeLinkPresenter[];
}
