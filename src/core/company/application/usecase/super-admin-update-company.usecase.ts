import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { CompanyOutput } from '@/shared/application/output/company/company.output';
import { Company } from '../../domain/entities/company.entity';

type Input = {
  id: string;
  fantasyName: string;
  socialReazon: string;
  cnpj: string;
  email: string;
  phoneNumber: string;
  stateRegistration: string;
  active: boolean;
  planId?: string;
};

type Output = CompanyOutput;

export class SuperAdminUpdateCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(PROVIDERS.PLAN_REPOSITORY)
    private readonly planRepository: PlanRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const updatedBy = loggedUser?.id ?? ID_USER_DEFAULT;

    const company = await this.companyRepository.findById(input.id);

    if (!company) {
      throw new NotFoundError(`Empresa não encontrada`);
    }

    if (input.cnpj !== company.cnpj) {
      const existCompany = await this.companyRepository.findByCnpj(
        input.cnpj,
      );

      if (existCompany && existCompany.id !== company.id) {
        throw new ConflictError(`O ${input.cnpj} cnpj já está cadastrado`);
      }
    }

    company.update({
      fantasyName: input.fantasyName,
      socialReazon: input.socialReazon,
      cnpj: input.cnpj,
      email: input.email,
      phoneNumber: input.phoneNumber,
      stateRegistration: input.stateRegistration,
      plan: company.plan!,
      address: company.address ?? undefined,
      updatedBy,
    });

    if (input.planId && input.planId !== company.plan?.id) {
      const plan = await this.planRepository.findById(input.planId);

      if (!plan) {
        throw new NotFoundError(`Plano não encontrado`);
      }

      company.renewPlan(plan, updatedBy);
    } else if (input.active !== company.active) {
      company.setActive(input.active, updatedBy);
    }

    await this.companyRepository.update(company);

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
