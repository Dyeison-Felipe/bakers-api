import { ApiProperty } from '@nestjs/swagger';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { DailyProductionItemPresenter } from './daily-production-item.presenter';

export class DailyProductionPresenter {
  @ApiProperty({ description: 'Id da produção diária' })
  readonly id: string;

  @ApiProperty({ description: 'Data da produção' })
  readonly productionDate: Date;

  @ApiProperty({ enum: TypeDailyProductionStatus })
  readonly status: TypeDailyProductionStatus;

  @ApiProperty({ description: 'Custo total planejado da produção' })
  readonly totalPlannedCost: number;

  @ApiProperty({
    description: 'Itens da produção',
    type: () => DailyProductionItemPresenter,
    isArray: true,
  })
  readonly items: DailyProductionItemPresenter[];
}
