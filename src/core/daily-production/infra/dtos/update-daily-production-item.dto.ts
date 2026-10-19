import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { QUANTITY_MAX } from '@/shared/domain/constants/field-limits';

export class UpdateDailyProductionItemDto {
  @ApiPropertyOptional({
    description: 'Quantidade a produzir (produtos por unidade/caixa)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  readonly plannedQuantity?: number;

  @ApiPropertyOptional({
    description: 'Multiplicador de receita (produtos por peso)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  readonly recipeMultiplier?: number;
}
