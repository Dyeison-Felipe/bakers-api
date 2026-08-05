import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ description: 'Data da despesa', example: '2026-08-04' })
  @IsDateString()
  readonly date: string;

  @ApiProperty({ description: 'Valor da despesa', example: 50.9, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  readonly value: number;

  @ApiProperty({ description: 'Descrição da despesa', example: 'Mercado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly description: string;
}
