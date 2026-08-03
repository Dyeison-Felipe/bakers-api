import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateAdditionalCostDto {
  @ApiProperty({ description: 'Nome do gasto adicional', example: 'Gás' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  readonly name: string;
}