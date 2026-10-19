import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { QUANTITY_MAX } from '@/shared/domain/constants/field-limits';
import { TypeStockMovement } from '@/shared/infra/enums/stock-movement';

export class RegisterManualStockMovementDto {
  @ApiProperty({ description: 'Id do produto a movimentar' })
  @IsUUID()
  @IsNotEmpty()
  readonly productId: string;

  @ApiProperty({
    description: 'ENTRY = incluir no estoque, EXIT = dar baixa',
    enum: TypeStockMovement,
  })
  @IsEnum(TypeStockMovement)
  readonly type: TypeStockMovement;

  @ApiProperty({ description: 'Quantidade/peso movimentado' })
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  readonly quantity: number;

  @ApiProperty({ description: 'Observação livre (ex.: "compra", "inventário")', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly reasonDescription?: string;
}
