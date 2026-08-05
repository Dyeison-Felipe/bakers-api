import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateDailyProductionItemDto {
  @ApiPropertyOptional({
    description: 'Quantidade a produzir (produtos por unidade/caixa)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  readonly plannedQuantity?: number;

  @ApiPropertyOptional({
    description: 'Multiplicador de receita (produtos por peso)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  readonly recipeMultiplier?: number;
}
