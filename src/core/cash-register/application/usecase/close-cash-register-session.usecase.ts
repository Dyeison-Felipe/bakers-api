import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { CloseCashRegisterOutput } from '@/shared/application/output/cash-register/close-cash-register.output';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { TypeCashRegisterMovement } from '@/shared/infra/enums/cash-register';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';

type Input = {
  id: string;
};

type Output = CloseCashRegisterOutput;

export class CloseCashRegisterSessionUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY)
    private readonly cashRegisterMovementRepository: CashRegisterMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const session = await this.cashRegisterSessionRepository.findByIdAndCompanyId(
      input.id,
      loggedUser.company.id,
    );

    if (!session) {
      throw new NotFoundError('Caixa não encontrado');
    }

    if (session.status !== TypeCashRegisterSessionStatus.OPEN) {
      throw new BadRequestError('Este caixa já está fechado');
    }

    const [
      totalCashSales,
      totalPix,
      totalCard,
      totalSupplies,
      totalWithdrawals,
    ] = await Promise.all([
      this.saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod(
        session.id,
        TypePaymentMethod.CASH,
      ),
      this.saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod(
        session.id,
        TypePaymentMethod.PIX,
      ),
      this.saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod(
        session.id,
        TypePaymentMethod.CARD,
      ),
      this.cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdAndType(
        session.id,
        TypeCashRegisterMovement.SUPPLY,
      ),
      this.cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdAndType(
        session.id,
        TypeCashRegisterMovement.WITHDRAWAL,
      ),
    ]);

    const totalCash = totalCashSales + totalSupplies - totalWithdrawals;

    session.close({
      totalCash,
      totalPix,
      totalCard,
      closedBy: loggedUser.id,
    });

    await this.cashRegisterSessionRepository.update(session);

    return {
      id: session.id,
      openingAmount: session.openingAmount,
      totalCash,
      totalPix,
      totalCard,
      closedAt: session.closedAt!,
    };
  }
}
