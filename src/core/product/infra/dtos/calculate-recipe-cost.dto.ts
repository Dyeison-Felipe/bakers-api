import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AdditionalCostInputDto } from './additional-cost.dto';

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
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductMaterialDto)
  productMaterial: ProductMaterialDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalCostInputDto)
  additionalCosts?: AdditionalCostInputDto[];
}