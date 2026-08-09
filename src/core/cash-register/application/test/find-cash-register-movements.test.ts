import { FindCashRegisterMovementsUseCase } from '../usecase/find-cash-register-movements.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { TypeCashRegisterMovement, TypeCashRegisterMovementReason } from '@/shared/infra/enums/cash-register';
import { makeSession } from './fixtures';
import type { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import type { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';

describe('FindCashRegisterMovementsUseCase', () => {
  let cashRegisterSessionRepository: jest.Mocked<Pick<CashRegisterSessionRepository, 'findById'>>;
  let cashRegisterMovementRepository: jest.Mocked<
    Pick<CashRegisterMovementRepository, 'findAllByCashRegisterSessionId'>
  >;
  let sut: FindCashRegisterMovementsUseCase;

  beforeEach(() => {
    cashRegisterSessionRepository = { findById: jest.fn() };
    cashRegisterMovementRepository = { findAllByCashRegisterSessionId: jest.fn() };

    sut = new FindCashRegisterMovementsUseCase(
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      cashRegisterMovementRepository as unknown as CashRegisterMovementRepository,
    );
  });

  it('should throw NotFoundError when the session does not exist', async () => {
    cashRegisterSessionRepository.findById.mockResolvedValue(null);

    await expect(
      sut.execute({ cashRegisterSessionId: 'session-1' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should map movements to the output shape', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findById.mockResolvedValue(session);
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
    cashRegisterSessionRepository.findById.mockResolvedValue(makeSession());
    cashRegisterMovementRepository.findAllByCashRegisterSessionId.mockResolvedValue([]);

    const output = await sut.execute({ cashRegisterSessionId: 'session-1' });

    expect(output).toEqual([]);
  });
});
