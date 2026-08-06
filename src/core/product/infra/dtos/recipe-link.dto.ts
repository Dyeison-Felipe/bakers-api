import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RecipeLinkInputDto {
  @ApiProperty({ description: 'Id da receita reutilizável' })
  @IsUUID()
  id: string;
}
