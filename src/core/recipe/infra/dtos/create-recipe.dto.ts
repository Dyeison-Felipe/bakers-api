import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QUANTITY_MAX } from '@/shared/domain/constants/field-limits';

export class RecipeItemInputDto {
  @ApiProperty({ description: 'Id do produto matéria-prima' })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Quantidade utilizada, na unidade de consumo da matéria-prima',
  })
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  quantity: number;
}

export class CreateRecipeDto {
  @ApiProperty({ description: 'Nome da receita', example: 'Massa de assado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Matérias-primas que compõem a receita',
    type: [RecipeItemInputDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeItemInputDto)
  items: RecipeItemInputDto[];
}
