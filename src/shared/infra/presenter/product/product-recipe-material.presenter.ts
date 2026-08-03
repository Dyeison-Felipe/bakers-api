import { ApiProperty } from "@nestjs/swagger";

export class RecipeMaterialPresenter {
  @ApiProperty({ description: 'Identificador da matéria-prima' })
  readonly id: string;

  @ApiProperty({ description: 'Nome da matéria-prima' })
  readonly name: string;

  @ApiProperty({ description: 'Caminho da imagem da matéria-prima' })
  readonly imagePath: string | null;

  @ApiProperty({ description: 'Unidade de consumo da matéria-prima' })
  readonly consumerUnit: string | null;

  @ApiProperty({ description: 'Preço de custo unitário da matéria-prima' })
  readonly unitCostPrice: number;

  @ApiProperty({ description: 'Preço por quilograma da matéria-prima' })
  readonly pricePerKilogram: number | null;

  @ApiProperty({ description: 'Preço de custo total da matéria-prima' })
  readonly costPrice: number;
}