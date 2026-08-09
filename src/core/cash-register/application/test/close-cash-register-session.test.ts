import { CloseCashRegisterSessionUseCase } from '../usecase/close-cash-register-session.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { makeLoggedUser, makeSession } from './fixtures';
import type { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import type { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';
import type { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('CloseCashRegisterSessionUseCase', () => {
  let cashRegisterSessionRepository: jest.Mocked<
    Pick<CashRegisterSessionRepository, 'findByIdAndCompanyId' | 'update'>
  >;
  let saleRepository: jest.Mocked<
    Pick<SaleRepository, 'sumTotalByCashRegisterSessionAndPaymentMethod'>
  >;
  let cashRegisterMovementRepository: jest.Mocked<
    Pick<CashRegisterMovementRepository, 'sumAmountByCashRegisterSessionIdAndType'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: CloseCashRegisterSessionUseCase;

  beforeEach(() => {
    cashRegisterSessionRepository = {
      findByIdAndCompanyId: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    saleRepository = {
      sumTotalByCashRegisterSessionAndPaymentMethod: jest.fn().mockResolvedValue(0),
    };
    cashRegisterMovementRepository = {
      sumAmountByCashRegisterSessionIdAndType: jest.fn().mockResolvedValue(0),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new CloseCashRegisterSessionUseCase(
      cashRegisterSessionRepository as unknown as CashRegisterSessionRepository,
      saleRepository as unknown as SaleRepository,
      cashRegisterMovementRepository as unknown as CashRegisterMovementRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the session does not exist for the logged company', async () => {
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(sut.execute({ id: 'session-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the session is already closed', async () => {
    const session = makeSession({ status: TypeCashRegisterSessionStatus.CLOSED });
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);

    await expect(sut.execute({ id: session.id })).rejects.toThrow(BadRequestError);
  });

  it('should compute totalCash as cash sales + supplies - withdrawals', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod.mockImplementation(
      (_id, method) => Promise.resolve(method === 'CASH' ? 100 : 0),
    );
    cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdAndType.mockImplementation(
      (_id, type) => Promise.resolve(type === 'SUPPLY' ? 30 : 20),
    );

    const output = await sut.execute({ id: session.id });

    expect(output.totalCash).toBe(110); // 100 + 30 - 20
  });

  it('should compute totalPix and totalCard directly from sale sums', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);
    saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod.mockImplementation(
      (_id, method) => {
        if (method === 'PIX') return Promise.resolve(50);
        if (method === 'CARD') return Promise.resolve(75);
        return Promise.resolve(0);
      },
    );

    const output = await sut.execute({ id: session.id });

    expect(output.totalPix).toBe(50);
    expect(output.totalCard).toBe(75);
  });

  it('should mark the session as CLOSED and persist it', async () => {
    const session = makeSession();
    cashRegisterSessionRepository.findByIdAndCompanyId.mockResolvedValue(session);

    await sut.execute({ id: session.id });

    expect(session.status).toBe(TypeCashRegisterSessionStatus.CLOSED);
    expect(session.closedAt).toBeInstanceOf(Date);
    expect(cashRegisterSessionRepository.update).toHaveBeenCalledWith(session);
  });
});
