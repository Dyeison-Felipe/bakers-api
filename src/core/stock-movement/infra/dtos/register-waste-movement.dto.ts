import { ApiProperty } from '@nestjs/swagger';
import {
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

export class RegisterWasteMovementDto {
  @ApiProperty({ description: 'Id do produto perdido/descartado' })
  @IsUUID()
  @IsNotEmpty()
  readonly productId: string;

  @ApiProperty({ description: 'Quantidade/peso perdido' })
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  readonly quantity: number;

  @ApiProperty({ description: 'Descrição livre do motivo', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly reasonDescription?: string;
}
