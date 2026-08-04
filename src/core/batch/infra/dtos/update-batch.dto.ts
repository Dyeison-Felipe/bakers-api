import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBatchDto {
  @ApiProperty({
    description: 'Nova quantidade/peso total do lote (correção manual)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly quantity?: number;

  @ApiProperty({
    description: 'Nova data de validade do lote (correção manual)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  readonly expirationDate?: string;
}
