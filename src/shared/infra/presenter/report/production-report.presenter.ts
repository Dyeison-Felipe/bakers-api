import { ApiProperty } from '@nestjs/swagger';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';

export class ProductionReportItemPresenter {
  @ApiProperty({ description: 'Id do item de produção' })
  readonly id: string;

  @ApiProperty({ description: 'Data da produção' })
  readonly productionDate: Date;

  @ApiProperty({ description: 'Id do produto' })
  readonly productId: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly productName: string;

  @ApiProperty({ description: 'Quantidade planejada' })
  readonly plannedQuantity: number | null;

  @ApiProperty({ description: 'Peso planejado (kg)' })
  readonly plannedWeight: number | null;

  @ApiProperty({ description: 'Custo planejado do item' })
  readonly plannedCost: number;

  @ApiProperty({
    description: 'Status do item de produção',
    enum: TypeDailyProductionItemStatus,
  })
  readonly status: TypeDailyProductionItemStatus;
}

export class ProductionReportDailyPointPresenter {
  @ApiProperty({ description: 'Dia (YYYY-MM-DD)' })
  readonly day: string;

  @ApiProperty({ description: 'Custo real de produção no dia (itens já confirmados)' })
  readonly total: number;
}

export class ProductionReportPresenter {
  @ApiProperty({
    description: 'Custo real de produção no período (soma dos itens já confirmados)',
  })
  readonly totalProducedCost: number;

  @ApiProperty({ type: [ProductionReportDailyPointPresenter] })
  readonly dailySeries: ProductionReportDailyPointPresenter[];

  @ApiProperty({ type: [ProductionReportItemPresenter] })
  readonly items: ProductionReportItemPresenter[];
}
