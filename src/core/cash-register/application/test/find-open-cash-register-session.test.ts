import { FindOpenCashRegisterSessionUseCase } from '../usecase/find-open-cash-register-session.usecase';
import { makeLoggedUser, makeSession } from './fixtures';
import type { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindOpenCashRegisterSessionUseCase', () => {
  let cashRegisterSessionRepository: jest.Mocked<
    Pick<CashRegisterSessionRepository, 'findOpenByCompanyId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindOpenCashRegisterSessionUseCase;

  beforeEach(() => {
    cashRegisterSessionRepository = { findOpenByCompanyId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindOpenCashRegisterSessionUseCase(
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      loggedUserService,
    );
  });

  it('should return null when there is no open session', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(null);

    const output = await sut.execute();

    expect(output).toBeNull();
  });

  it('should scope the query by the logged user company id', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(null);

    await sut.execute();

    expect(cashRegisterSessionRepository.findOpenByCompanyId).toHaveBeenCalledWith(
      'company-1',
    );
  });

  it('should map the session to the output shape', async () => {
    const session = makeSession({ openingAmount: 300 });
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(session);

    const output = await sut.execute();

    expect(output).toEqual({
      id: session.id,
      status: session.status,
      openingAmount: 300,
      openedAt: session.openedAt,
      openedBy: session.openedBy,
    });
  });
});
