import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { TopSellingProductOutput } from '@/shared/application/output/dashboard/top-selling-products.output';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import { isPermissionInPlan } from '@/shared/application/helpers/plan-permission.helper';
import { PermissionSale } from '@/core/auth/domain/permissions-definition/sale';
import { getBusinessTodayRange } from '@/shared/infra/utils/get-business-today-range';

type Input = void;
type Output = TopSellingProductOutput[];

export const TOP_SELLING_PRODUCTS_LIMIT = 10;

export class FindTopSellingProductsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_ITEM_REPOSITORY)
    private readonly saleItemRepository: SaleItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    // Empresa sem PDV/Caixa no plano não tem venda — devolve vazio em vez de
    // 403 (Dashboard nunca deve exibir erro de permissão).
    const canReadSales = isPermissionInPlan(
      loggedUser.company.plan?.permissions,
      PermissionSale.SALE_READER,
    );
    if (!canReadSales) return [];

    const { startOfDay, endOfDay } = getBusinessTodayRange();

    return await this.saleItemRepository.findTopSoldByCompanyAndDateRange(
      loggedUser.company.id,
      startOfDay,
      endOfDay,
      TOP_SELLING_PRODUCTS_LIMIT,
    );
  }
}
