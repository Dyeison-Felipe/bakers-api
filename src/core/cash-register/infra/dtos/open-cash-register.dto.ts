import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @ApiProperty({ description: 'Valor em dinheiro na abertura do caixa' })
  @IsNumber()
  @Min(0)
  openingAmount: number;
}
