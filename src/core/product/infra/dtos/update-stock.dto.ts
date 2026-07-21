import { TypeOperationStock } from '@/shared/infra/enums/product-stock.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Tipo de operação no estoque',
    enum: TypeOperationStock,
  })
  @IsEnum(TypeOperationStock)
  type: TypeOperationStock;

  @ApiProperty({ description: 'Quantidade a ser incrementada ou decrementada' })
  @IsNumber()
  @IsPositive()
  value: number;
}
