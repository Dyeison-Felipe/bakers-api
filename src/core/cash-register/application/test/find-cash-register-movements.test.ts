import { FindCashRegisterMovementsUseCase } from '../usecase/find-cash-register-movements.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { TypeCashRegisterMovement, TypeCashRegisterMovementReason } from '@/shared/infra/enums/cash-register';
import { makeLoggedUser, makeSession } from './fixtures';
import type { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import type { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindCashRegisterMovementsUseCase', () => {
  let cashRegisterSessionRepository: jest.Mocked<Pick<CashRegisterSessionRepository, 'findByIdAndCompanyId'>>;
  let cashRegisterMovementRepository: jest.Mocked<
    Pick<CashRegisterMovementRepository, 'findAllByCashRegisterSessionId'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindCashRegisterMovementsUseCase;

  beforeEach(() => {
    cashRegisterSessionRepository = { findByIdAndCompanyId: jest.fn() };
    cashRegisterMovementRepository = { findAllByCashRegisterSessionId: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindCashRegisterMovementsUseCase(
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      cashRegisterMovementRepository as unknown as CashRegisterMovementRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the session does not exist for the logged company', async () => {
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      sut.execute({ cashRegisterSessionId: 'session-1' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should scope the session lookup to the logged company (tenant isolation)', async () => {
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(makeSession());
    cashRegisterMovementRepository.findAllByCashRegisterSessionId.mockResolvedValue([]);

    await sut.execute({ cashRegisterSessionId: 'session-1' });

    expect(cashRegisterSessionRepository.findByIdAndCompanyId).toHaveBeenCalledWith(
      'session-1',
      'company-1',
    );
  });

  it('should map movements to the output shape', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    cashRegisterMovementRepository.findAllByCashRegisterSessionId.mockResolvedValue([
      {
        id: 'movement-1',
        type: TypeCashRegisterMovement.SUPPLY,
        reason: TypeCashRegisterMovementReason.OWNER_REINFORCEMENT,
        description: null,
        amount: 50,
        balanceBefore: 100,
        balanceAfter: 150,
        auditable: { createdAt: new Date('2026-08-09'), updatedAt: new Date(), deletedAt: null },
      } as never,
    ]);

    const output = await sut.execute({ cashRegisterSessionId: session.id });

    expect(output).toEqual([
      {
        id: 'movement-1',
        type: TypeCashRegisterMovement.SUPPLY,
        reason: TypeCashRegisterMovementReason.OWNER_REINFORCEMENT,
        description: null,
        amount: 50,
        balanceBefore: 100,
        balanceAfter: 150,
        createdAt: new Date('2026-08-09'),
      },
    ]);
  });

  it('should return an empty array when there are no movements', async () => {
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(makeSession());
    cashRegisterMovementRepository.findAllByCashRegisterSessionId.mockResolvedValue([]);

    const output = await sut.execute({ cashRegisterSessionId: 'session-1' });

    expect(output).toEqual([]);
  });
});
