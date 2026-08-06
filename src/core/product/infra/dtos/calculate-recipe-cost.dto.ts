import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AdditionalCostInputDto } from './additional-cost.dto';
import { RecipeLinkInputDto } from './recipe-link.dto';

export class ProductMaterialDto {
  @ApiProperty({ description: 'ID do produto matéria-prima' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Quantidade utilizada, na unidade de consumo da matéria-prima' })
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class CalculateRecipeCostDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMaterialDto)
  productMaterial?: ProductMaterialDto[];

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