import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddDailyProductionItemDto } from './add-daily-production-item.dto';

export class AddDailyProductionItemsDto {
  @ApiProperty({
    description: 'Itens a adicionar/somar na produção diária',
    type: () => AddDailyProductionItemDto,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddDailyProductionItemDto)
  readonly items: AddDailyProductionItemDto[];
}
