import { FindProductionReportUseCase } from '../usecase/find-production-report.usecase';
import {
  makeLoggedUser,
  makeItem,
  makeProduct,
  makePagination,
} from '@/core/daily-production/application/test/fixtures';
import { TypeProduct } from '@/shared/infra/enums/product';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import type { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import type { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindProductionReportUseCase', () => {
  let dailyProductionRepository: jest.Mocked<
    Pick<DailyProductionRepository, 'findAllByCompanyId'>
  >;
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findAllByDailyProductionId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindProductionReportUseCase;

  const dateFrom = new Date('2026-08-01T00:00:00Z');
  const dateTo = new Date('2026-08-31T23:59:59Z');

  const productA = makeProduct({
    id: 'product-a',
    typeProduct: TypeProduct.OWN_PRODUCTION,
    category: { id: 'category-a' },
  });
  const productB = makeProduct({
    id: 'product-b',
    typeProduct: TypeProduct.RESALE,
    category: { id: 'category-b' },
  });

  beforeEach(() => {
    dailyProductionRepository = {
      findAllByCompanyId: jest.fn().mockResolvedValue(
        makePagination([
          { id: 'dp-1', productionDate: new Date('2026-08-09T00:00:00Z') } as never,
        ]),
      ),
    };
    dailyProductionItemRepository = {
      findAllByDailyProductionId: jest.fn().mockResolvedValue([
        makeItem({ id: 'item-a', product: productA, status: TypeDailyProductionItemStatus.PRODUCED }),
        makeItem({ id: 'item-b', product: productB, status: TypeDailyProductionItemStatus.PRODUCED }),
      ]),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    } as unknown as jest.Mocked<LoggedUserService>;

    sut = new FindProductionReportUseCase(
      dailyProductionRepository as unknown as DailyProductionRepository,
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
    );
  });

  it('should return every item when no filter is given', async () => {
    const output = await sut.execute({ dateFrom, dateTo });

    expect(output.items.map((i) => i.productId)).toEqual(['product-a', 'product-b']);
  });

  it('should filter items by productId', async () => {
    const output = await sut.execute({ dateFrom, dateTo, productId: 'product-a' });

    expect(output.items.map((i) => i.productId)).toEqual(['product-a']);
  });

  it('should filter items by categoryId', async () => {
    const output = await sut.execute({ dateFrom, dateTo, categoryId: 'category-b' });

    expect(output.items.map((i) => i.productId)).toEqual(['product-b']);
  });

  it('should filter items by typeProduct', async () => {
    const output = await sut.execute({
      dateFrom,
      dateTo,
      typeProduct: TypeProduct.RESALE,
    });

    expect(output.items.map((i) => i.productId)).toEqual(['product-b']);
  });

  it('should recompute totalProducedCost from the filtered items only', async () => {
    const output = await sut.execute({ dateFrom, dateTo, productId: 'product-a' });

    expect(output.totalProducedCost).toBe(5);
  });
});
