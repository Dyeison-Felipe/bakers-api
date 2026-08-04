import { ApiProperty } from '@nestjs/swagger';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';

class DailyProductionItemProductPresenter {
  @ApiProperty({ description: 'Id do produto' })
  readonly id: string;

  @ApiProperty({ description: 'Nome do produto' })
  readonly name: string;
}

export class DailyProductionItemPresenter {
  @ApiProperty({ description: 'Id do item de produção' })
  readonly id: string;

  @ApiProperty({
    description: 'Produto do item',
    type: () => DailyProductionItemProductPresenter,
  })
  readonly product: DailyProductionItemProductPresenter;

  @ApiProperty({ enum: TypeUnitOfMeasurement })
  readonly unitOfMeasurement: TypeUnitOfMeasurement;

  @ApiProperty({ description: 'Quantidade planejada, em unidades' })
  readonly plannedQuantity: number | null;

  @ApiProperty({ description: 'Multiplicador de receita planejado' })
  readonly recipeMultiplier: number | null;

  @ApiProperty({ description: 'Peso planejado (kg)' })
  readonly plannedWeight: number | null;

  @ApiProperty({ description: 'Custo planejado do item (fixo)' })
  readonly plannedCost: number;

  @ApiProperty({ enum: TypeDailyProductionItemStatus })
  readonly status: TypeDailyProductionItemStatus;

  @ApiProperty({ description: 'Quantidade real produzida, em unidades' })
  readonly actualQuantity: number | null;

  @ApiProperty({ description: 'Peso real produzido (kg)' })
  readonly actualWeight: number | null;

  @ApiProperty({ description: 'Data/hora em que o item foi produzido' })
  readonly producedAt: Date | null;
}
