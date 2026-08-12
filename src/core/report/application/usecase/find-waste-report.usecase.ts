import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import {
  WasteReportDailyPoint,
  WasteReportItem,
  WasteReportOutput,
  WasteReportProductPoint,
} from '@/shared/application/output/report/waste-report.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = WasteReportOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

export class FindWasteReportUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_MOVEMENT_REPOSITORY)
    private readonly batchMovementRepository: BatchMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const [wasteRows, recoveredRows] = await Promise.all([
      this.batchMovementRepository.findAllByCompanyAndDateAndReason(
        companyId,
        dateFrom,
        dateTo,
        [TypeBatchMovementReason.WASTE, TypeBatchMovementReason.MANUAL_DISCARD],
      ),
      this.batchMovementRepository.findAllByCompanyAndDateAndReason(
        companyId,
        dateFrom,
        dateTo,
        [TypeBatchMovementReason.LEFTOVER_SOLD_AT_COST],
      ),
    ]);

    const wasteItems: WasteReportItem[] = wasteRows.map((row) => ({
      id: row.id,
      date: row.createdAt,
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
      unitOfMeasurement: row.unitOfMeasurement,
      unitCost: row.unitCostSnapshot,
      totalCost: round2(row.totalCost),
      reason: row.reason,
      reasonDescription: row.reasonDescription,
    }));

    const recoveredItems: WasteReportItem[] = recoveredRows.map((row) => ({
      id: row.id,
      date: row.createdAt,
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
      unitOfMeasurement: row.unitOfMeasurement,
      unitCost: row.unitCostSnapshot,
      totalCost: round2(row.totalCost),
      reason: row.reason,
      reasonDescription: row.reasonDescription,
    }));

    const totalWaste = round2(
      wasteItems.reduce((sum, item) => sum + item.totalCost, 0),
    );
    const totalRecoveredAtCost = round2(
      recoveredItems.reduce((sum, item) => sum + item.totalCost, 0),
    );

    const dailyMap = new Map<string, number>();
    for (const item of wasteItems) {
      const day = toDayKey(item.date);
      dailyMap.set(day, round2((dailyMap.get(day) ?? 0) + item.totalCost));
    }
    const dailySeries: WasteReportDailyPoint[] = Array.from(
      dailyMap.entries(),
    )
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const byProductMap = new Map<
      string,
      { productName: string; quantity: number; totalCost: number }
    >();
    for (const item of wasteItems) {
      const current = byProductMap.get(item.productId) ?? {
        productName: item.productName,
        quantity: 0,
        totalCost: 0,
      };
      current.quantity = round2(current.quantity + item.quantity);
      current.totalCost = round2(current.totalCost + item.totalCost);
      byProductMap.set(item.productId, current);
    }
    const byProduct: WasteReportProductPoint[] = Array.from(
      byProductMap.entries(),
    )
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.totalCost - a.totalCost);

    return {
      totalWaste,
      totalRecoveredAtCost,
      dailySeries,
      byProduct,
      wasteItems,
      recoveredItems,
    };
  }
}
