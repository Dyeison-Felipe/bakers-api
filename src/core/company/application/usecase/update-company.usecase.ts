import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { AddressRepository } from '@/core/address/domain/repositories/address.repository';
import { CityRepository } from '@/core/city/domain/repositories/city.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { CreateAddressInput } from '@/shared/application/input/address/create-address.input';
import { CreateCompanyOutput } from '@/shared/application/output/company/create-company-output';
import { Company } from '../../domain/entities/company.entity';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';

type Input = {
  fantasyName: string;
  socialReazon: string;
  cnpj: string;
  stateRegistration: string;
  email: string;
  phoneNumber: string;
  address: CreateAddressInput;
};

type Output = CreateCompanyOutput;

export class UpdateCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(PROVIDERS.ADDRESS_REPOSITORY)
    private readonly addressRepository: AddressRepository,
    @Inject(PROVIDERS.CITY_REPOSITORY)
    private readonly cityRepository: CityRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const company = await this.companyRepository.findById(
      loggedUser.company.id,
    );

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

    if (company.address) {
      const city = await this.cityRepository.findById(input.address.cityId);

      if (!city) {
        throw new NotFoundError(`Cidade não encontrada`);
      }

      company.address.cep = input.address.cep;
      company.address.neighborhood = input.address.neighborhood;
      company.address.street = input.address.street;
      company.address.number = input.address.number;
      company.address.complement = input.address.complement;
      company.address.latitude = input.address.latitude ?? null;
      company.address.longitude = input.address.longitude ?? null;
      company.address.city = city;

      await this.addressRepository.update(company.address);
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
      updatedBy: loggedUser?.id ?? ID_USER_DEFAULT,
    });

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
      createdBy: company.createdBy,
      updatedBy: company.updatedBy,
      deletedBy: company.deletedBy,
    };
  }
}
