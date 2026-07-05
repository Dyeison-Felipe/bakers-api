import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'ID da categoria',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Eletrônicos',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'ID da categoria pai',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
