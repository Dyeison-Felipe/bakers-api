import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class MarkItemProducedDto {
  @ApiProperty({
    description:
      'Peso real produzido (obrigatório apenas para produtos vendidos por KG)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  readonly actualWeight?: number;
}
