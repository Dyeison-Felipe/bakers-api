import { ApiProperty } from '@nestjs/swagger';

export class RecipePresenter {
  @ApiProperty({ description: 'Id da receita' })
  readonly id: string;

  @ApiProperty({ description: 'Nome da receita' })
  readonly name?: string;

  constructor(props: RecipePresenter) {
    this.id = props.id;
    this.name = props.name;
  }
}
