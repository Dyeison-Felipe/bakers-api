import { FindAllCashRegisterSessionsUseCase } from '../usecase/find-all-cash-register-sessions.usecase';
import { makeLoggedUser, makePagination, makeSession } from './fixtures';
import type { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindAllCashRegisterSessionsUseCase', () => {
  let cashRegisterSessionRepository: jest.Mocked<
    Pick<CashRegisterSessionRepository, 'findAllByCompanyId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAllCashRegisterSessionsUseCase;

  beforeEach(() => {
    cashRegisterSessionRepository = { findAllByCompanyId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindAllCashRegisterSessionsUseCase(
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      loggedUserService,
    );
  });

  it('should scope the query by the logged user company id and forward pagination', async () => {
    cashRegisterSessionRepository.findAllByCompanyId.mockResolvedValue(
      makePagination([]),
    );

    await sut.execute({ page: 3, limit: 20 });

    expect(cashRegisterSessionRepository.findAllByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { page: 3, limit: 20 },
    );
  });

  it('should map each session to the list output shape, preserving pagination meta', async () => {
    const session = makeSession({ totalCash: 100, totalPix: 50, totalCard: 25 });
    const pagination = makePagination([session]);
    cashRegisterSessionRepository.findAllByCompanyId.mockResolvedValue(pagination);

    const output = await sut.execute({});

    expect(output.meta).toEqual(pagination.meta);
    expect(output.items).toEqual([
      {
        id: session.id,
        status: session.status,
        openingAmount: session.openingAmount,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        totalCash: 100,
        totalPix: 50,
        totalCard: 25,
      },
    ]);
  });
});
