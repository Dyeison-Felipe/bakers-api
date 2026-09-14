import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AdditionalCostInputDto } from './additional-cost.dto';
import { RecipeLinkInputDto } from './recipe-link.dto';

export class CalculateRecipeCostDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalCostInputDto)
  additionalCosts?: AdditionalCostInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLinkInputDto)
  recipeLinks?: RecipeLinkInputDto[];
}