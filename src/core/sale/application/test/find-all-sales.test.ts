import { FindAllSalesUseCase } from '../usecase/find-all-sales.usecase';
import { makeLoggedUser, makePagination, makeSale } from './fixtures';
import type { SaleRepository } from '../../domain/repositories/sale.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindAllSalesUseCase', () => {
  let saleRepository: jest.Mocked<Pick<SaleRepository, 'findAllByCompanyId'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAllSalesUseCase;

  beforeEach(() => {
    saleRepository = { findAllByCompanyId: jest.fn().mockResolvedValue(makePagination([])) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindAllSalesUseCase(
      saleRepository as unknown as SaleRepository,
      loggedUserService,
    );
  });

  it('should scope the search by the logged user company id and forward filters/pagination', async () => {
    await sut.execute({ page: 2, cashRegisterSessionId: 'session-1' });

    expect(saleRepository.findAllByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { cashRegisterSessionId: 'session-1' },
      { page: 2 },
    );
  });

  it('should map each sale to the output shape', async () => {
    saleRepository.findAllByCompanyId.mockResolvedValue(makePagination([makeSale()]));

    const output = await sut.execute({});

    expect(output.items).toEqual([
      {
        id: 'sale-1',
        status: 'COMPLETED',
        paymentMethod: 'CASH',
        totalAmount: 10,
        createdAt: expect.any(Date),
      },
    ]);
  });
});
