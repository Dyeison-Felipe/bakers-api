import { ApiProperty } from '@nestjs/swagger';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';

export class FindAllDailyProductionsPresenter {
  @ApiProperty({ description: 'Id da produção diária' })
  readonly id: string;

  @ApiProperty({ description: 'Data da produção' })
  readonly productionDate: Date;

  @ApiProperty({ enum: TypeDailyProductionStatus })
  readonly status: TypeDailyProductionStatus;

  @ApiProperty({ description: 'Custo total planejado da produção' })
  readonly totalPlannedCost: number;

  @ApiProperty({ description: 'Quantidade de itens da produção' })
  readonly itemCount: number;
}
