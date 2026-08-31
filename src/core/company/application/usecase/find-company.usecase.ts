import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { CreateCompanyOutput } from '@/shared/application/output/company/create-company-output';
import { Company } from '../../domain/entities/company.entity';

type Input = void;

type Output = CreateCompanyOutput;

export class FindCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const company = await this.companyRepository.findById(
      loggedUser.company.id,
    );

    if (!company) {
      throw new NotFoundError(`Empresa não encontrada`);
    }

    return this.output(company);
  }

  private output(company: Company): Output {
    return {
      id: company.id,
      fantasyName: company.fantasyName,
      socialReazon: company.socialReazon,
      cnpj: company.cnpj,
      email: company.email,
      phoneNumber: company.phoneNumber,
      active: company.active,
      stateRegistration: company.stateRegistration,
      plan: company.plan!,
      address: company.address!,
      planStartedAt: company.planStartedAt,
      planExpiresAt: company.planExpiresAt,
      createdBy: company.createdBy,
      updatedBy: company.updatedBy,
      deletedBy: company.deletedBy,
    };
  }
}
