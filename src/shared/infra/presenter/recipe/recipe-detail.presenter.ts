import { ApiProperty } from '@nestjs/swagger';
import { RecipeItemPresenter } from './recipe-item.presenter';

export class RecipeDetailPresenter {
  @ApiProperty({ description: 'Id da receita' })
  readonly id: string;

  @ApiProperty({ description: 'Nome da receita' })
  readonly name: string;

  @ApiProperty({ description: 'Custo total calculado da receita' })
  readonly costPrice: number;

  @ApiProperty({
    description: 'Matérias-primas da receita',
    type: () => [RecipeItemPresenter],
  })
  readonly items: RecipeItemPresenter[];
}
