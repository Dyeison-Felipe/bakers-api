import {
  FindTopSellingProductsUseCase,
  TOP_SELLING_PRODUCTS_LIMIT,
} from '../usecase/find-top-selling-products.usecase';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import type { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

const makeLoggedUserService = (
  permissions: { subject: string; action: string }[],
) =>
  ({
    getLoggedUser: jest.fn().mockReturnValue({
      company: { id: 'company-1', plan: { permissions } },
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
      makeLoggedUserService([]),
    );

    await expect(sut.execute()).resolves.toEqual([]);
    expect(
      saleItemRepository.findTopSoldByCompanyAndDateRange,
    ).not.toHaveBeenCalled();
  });

  it("should query today's top products for the logged company with the limit", async () => {
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
      makeLoggedUserService([{ subject: 'sale', action: 'reader' }]),
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
});
