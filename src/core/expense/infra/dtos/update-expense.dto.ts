import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import { MONEY_MAX } from '@/shared/domain/constants/field-limits';

export class UpdateExpenseDto {
  @ApiProperty({ description: 'Data da despesa', example: '2026-08-04' })
  @IsDateString()
  readonly date: string;

  @ApiProperty({ description: 'Valor da despesa', example: 50.9, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Max(MONEY_MAX)
  readonly value: number;

  @ApiProperty({ description: 'Descrição da despesa', example: 'Mercado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly description: string;
}
