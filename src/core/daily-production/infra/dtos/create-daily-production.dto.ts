import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddDailyProductionItemDto } from './add-daily-production-item.dto';

export class CreateDailyProductionDto {
  @ApiProperty({ description: 'Data da produção' })
  @IsDateString()
  readonly productionDate: string;

  @ApiProperty({
    description: 'Itens já planejados para a produção (opcional)',
    required: false,
    type: () => AddDailyProductionItemDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddDailyProductionItemDto)
  readonly items?: AddDailyProductionItemDto[];
}
