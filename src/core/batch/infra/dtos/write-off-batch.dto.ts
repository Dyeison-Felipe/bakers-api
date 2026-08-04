import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';

export class WriteOffBatchDto {
  @ApiProperty({ description: 'Id do produto a ter estoque baixado' })
  @IsUUID()
  @IsNotEmpty()
  readonly productId: string;

  @ApiProperty({ description: 'Quantidade/peso a ser baixado' })
  @IsNumber()
  @Min(0.001)
  readonly quantity: number;

  @ApiProperty({
    description: 'Motivo da baixa manual',
    enum: TypeBatchMovementReason,
  })
  @IsEnum(TypeBatchMovementReason)
  readonly reason: TypeBatchMovementReason;

  @ApiProperty({ description: 'Descrição livre do motivo', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly reasonDescription?: string;
}
