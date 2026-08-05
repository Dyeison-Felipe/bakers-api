import { ApiProperty } from '@nestjs/swagger';

export class CancelDailyProductionItemPresenter {
  @ApiProperty({ description: 'Id do item de produção' })
  readonly id: string;
}
