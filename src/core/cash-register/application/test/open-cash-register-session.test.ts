import { OpenCashRegisterSessionUseCase } from '../usecase/open-cash-register-session.usecase';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { makeLoggedUser, makeSession } from './fixtures';
import type { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('OpenCashRegisterSessionUseCase', () => {
  let cashRegisterSessionRepository: jest.Mocked<
    Pick<CashRegisterSessionRepository, 'findOpenByCompanyId' | 'save'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: OpenCashRegisterSessionUseCase;

  beforeEach(() => {
    cashRegisterSessionRepository = {
      findOpenByCompanyId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((session) => Promise.resolve(session)),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new OpenCashRegisterSessionUseCase(
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      loggedUserService,
    );
  });

  it('should throw ConflictError when there is already an open session for the company', async () => {
    cashRegisterSessionRepository.findOpenByCompanyId.mockResolvedValue(
      makeSession(),
    );

    await expect(sut.execute({ openingAmount: 100 })).rejects.toThrow(
      ConflictError,
    );
    expect(cashRegisterSessionRepository.save).not.toHaveBeenCalled();
  });

  it('should open a new session with OPEN status and the informed opening amount', async () => {
    const output = await sut.execute({ openingAmount: 250 });

    expect(output.status).toBe(TypeCashRegisterSessionStatus.OPEN);
    expect(output.openingAmount).toBe(250);
    expect(output.id).toEqual(expect.any(String));
    expect(output.openedAt).toBeInstanceOf(Date);
    expect(cashRegisterSessionRepository.save).toHaveBeenCalledTimes(1);
  });
});
