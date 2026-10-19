import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';
import { MONEY_MAX } from '@/shared/domain/constants/field-limits';

export class OpenCashRegisterDto {
  @ApiProperty({ description: 'Valor em dinheiro na abertura do caixa' })
  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  openingAmount: number;
}
