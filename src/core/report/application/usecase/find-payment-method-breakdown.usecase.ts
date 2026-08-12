import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { PaymentMethodBreakdownOutput } from '@/shared/application/output/report/payment-method-breakdown.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = PaymentMethodBreakdownOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class FindPaymentMethodBreakdownUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const [cash, pix, card] = await Promise.all([
      this.saleRepository.sumTotalByCompanyAndDateRangeAndPaymentMethod(
        companyId,
        dateFrom,
        dateTo,
        TypePaymentMethod.CASH,
      ),
      this.saleRepository.sumTotalByCompanyAndDateRangeAndPaymentMethod(
        companyId,
        dateFrom,
        dateTo,
        TypePaymentMethod.PIX,
      ),
      this.saleRepository.sumTotalByCompanyAndDateRangeAndPaymentMethod(
        companyId,
        dateFrom,
        dateTo,
        TypePaymentMethod.CARD,
      ),
    ]);

    return {
      cash: round2(cash),
      pix: round2(pix),
      card: round2(card),
    };
  }
}
