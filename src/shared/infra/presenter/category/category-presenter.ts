import { ApiProperty } from "@nestjs/swagger";

export class CategoryPresenter {
    @ApiProperty({
      description: 'ID da categoria',
      example: '123e4567-e89b-12d3-a456-426614174000',
    })
    readonly id: string;
    @ApiProperty({
      description: 'Nome da categoria',
      example: 'Eletrônicos',
    })
    readonly name: string;
    @ApiProperty({
      description: 'ID da categoria pai',
      example: '123e4567-e89b-12d3-a456-426614174000',
      nullable: true,
    })
    readonly parentId: string | null;
    @ApiProperty({
      description: 'Categorias filhas',
      type: [CategoryPresenter],
    })
    readonly children: CategoryPresenter[];
}