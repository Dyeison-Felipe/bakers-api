import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { QUANTITY_MAX } from '@/shared/domain/constants/field-limits';

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
  @Max(QUANTITY_MAX)
  readonly plannedQuantity?: number;

  @ApiProperty({
    description:
      'Multiplicador de receita (ex: 1, 0.5, 2), para produtos vendidos por KG',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  readonly recipeMultiplier?: number;
}
