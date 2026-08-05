import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class DiscardBatchDto {
  @ApiPropertyOptional({
    description:
      'Quantidade a descartar. Se não informado, descarta toda a sobra do lote.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  readonly quantity?: number;

  @ApiPropertyOptional({ description: 'Observação sobre o descarte' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly reasonDescription?: string;
}
