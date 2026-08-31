import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { Pagination } from '@/shared/domain/pagination/pagination';
import { CompanyListItemOutput } from '@/shared/application/output/company/company-list-item.output';
import { Company } from '../../domain/entities/company.entity';

type Input = {
  search?: string;
  page?: number;
  limit?: number;
};

type Output = Pagination<CompanyListItemOutput>;

export class FindAllCompaniesUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const { items, meta } = await this.companyRepository.findAllPaginated(
      { page: input.page, limit: input.limit },
      input.search,
    );

    return {
      items: items.map((company) => this.output(company)),
      meta,
    };
  }

  private output(company: Company): CompanyListItemOutput {
    return {
      id: company.id,
      fantasyName: company.fantasyName,
      socialReazon: company.socialReazon,
      cnpj: company.cnpj,
      email: company.email,
      phoneNumber: company.phoneNumber,
      stateRegistration: company.stateRegistration,
      active: company.active,
      planStartedAt: company.planStartedAt,
      planExpiresAt: company.planExpiresAt,
      plan: company.plan
        ? {
            id: company.plan.id,
            name: company.plan.name,
            duration: company.plan.duration,
          }
        : null,
    };
  }
}
