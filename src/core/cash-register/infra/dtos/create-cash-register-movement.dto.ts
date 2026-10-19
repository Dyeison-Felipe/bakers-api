import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  TypeCashRegisterMovement,
  TypeCashRegisterMovementReason,
} from '@/shared/infra/enums/cash-register';
import { MONEY_MAX } from '@/shared/domain/constants/field-limits';

export class CreateCashRegisterMovementDto {
  @ApiProperty({
    description: 'Sangria (retirada) ou incremento (entrada)',
    enum: TypeCashRegisterMovement,
  })
  @IsEnum(TypeCashRegisterMovement)
  type: TypeCashRegisterMovement;

  @ApiProperty({
    description: 'Motivo da movimentação',
    enum: TypeCashRegisterMovementReason,
  })
  @IsEnum(TypeCashRegisterMovementReason)
  reason: TypeCashRegisterMovementReason;

  @ApiPropertyOptional({
    description: 'Descrição do motivo (obrigatória quando reason = OTHER)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ description: 'Valor movimentado' })
  @IsNumber()
  @Min(0.01)
  @Max(MONEY_MAX)
  amount: number;
}
