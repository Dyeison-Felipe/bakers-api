import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddDailyProductionItemDto {
  @ApiProperty({ description: 'Id do produto (produção própria)' })
  @IsUUID()
  readonly productId: string;

  @ApiProperty({
    description: 'Quantidade a produzir, em unidades (produtos vendidos por UN/CT)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  readonly plannedQuantity?: number;

  @ApiProperty({
    description:
      'Multiplicador de receita (ex: 1, 0.5, 2), para produtos vendidos por KG',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  readonly recipeMultiplier?: number;
}
