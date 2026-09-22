import {
  FindTopSellingProductsUseCase,
  TOP_SELLING_PRODUCTS_LIMIT,
} from '../usecase/find-top-selling-products.usecase';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import type { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

const makeLoggedUserService = (overrides: Record<string, unknown> = {}) =>
  ({
    getLoggedUser: jest.fn().mockReturnValue({
      company: {
        id: 'company-1',
        plan: { permissions: [{ subject: 'sale', action: 'reader' }] },
      },
      role: { name: 'Admin' },
      userPermissions: [],
      ...overrides,
    }),
    setLoggedUser: jest.fn(),
  }) as unknown as jest.Mocked<LoggedUserService>;

describe('FindTopSellingProductsUseCase', () => {
  let saleItemRepository: jest.Mocked<
    Pick<SaleItemRepository, 'findTopSoldByCompanyAndDateRange'>
  >;

  beforeEach(() => {
    saleItemRepository = {
      findTopSoldByCompanyAndDateRange: jest.fn().mockResolvedValue([]),
    };
  });

  it('should return an empty list without querying when the plan has no sale permission', async () => {
    const sut = new FindTopSellingProductsUseCase(
      saleItemRepository as unknown as SaleItemRepository,
      makeLoggedUserService({ company: { id: 'company-1', plan: { permissions: [] } } }),
    );

    await expect(sut.execute()).resolves.toEqual([]);
    expect(
      saleItemRepository.findTopSoldByCompanyAndDateRange,
    ).not.toHaveBeenCalled();
  });

  it('should return an empty list for a non-Admin user without sale.reader, even if the plan includes it', async () => {
    const sut = new FindTopSellingProductsUseCase(
      saleItemRepository as unknown as SaleItemRepository,
      makeLoggedUserService({ role: { name: 'Funcionário' }, userPermissions: [] }),
    );

    await expect(sut.execute()).resolves.toEqual([]);
    expect(
      saleItemRepository.findTopSoldByCompanyAndDateRange,
    ).not.toHaveBeenCalled();
  });

  it("should query today's top products for an Admin of the logged company with the limit", async () => {
    const rows = [
      {
        productId: 'p1',
        productName: 'Pão francês',
        unitOfMeasurement: TypeUnitOfMeasurement.UN,
        quantitySold: 42,
      },
    ];
    saleItemRepository.findTopSoldByCompanyAndDateRange.mockResolvedValue(rows);
    const sut = new FindTopSellingProductsUseCase(
      saleItemRepository as unknown as SaleItemRepository,
      makeLoggedUserService(),
    );

    await expect(sut.execute()).resolves.toEqual(rows);
    expect(
      saleItemRepository.findTopSoldByCompanyAndDateRange,
    ).toHaveBeenCalledWith(
      'company-1',
      expect.any(Date),
      expect.any(Date),
      TOP_SELLING_PRODUCTS_LIMIT,
    );
  });

  it('should query for a non-Admin user that individually has sale.reader', async () => {
    const sut = new FindTopSellingProductsUseCase(
      saleItemRepository as unknown as SaleItemRepository,
      makeLoggedUserService({
        role: { name: 'Funcionário' },
        userPermissions: [{ permission: { action: 'reader', subject: 'sale' } }],
      }),
    );

    await sut.execute();

    expect(saleItemRepository.findTopSoldByCompanyAndDateRange).toHaveBeenCalled();
  });
});
