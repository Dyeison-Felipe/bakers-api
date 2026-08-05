import { ApiProperty } from '@nestjs/swagger';

export class UpdateDailyProductionItemPresenter {
  @ApiProperty({ description: 'Id do item de produção' })
  readonly id: string;
}
