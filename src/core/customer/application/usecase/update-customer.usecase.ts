import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { CreateAddressInput } from '@/shared/application/input/address/create-address.input';
import { CustomerOutput } from '@/shared/application/output/customer/customer.output';
import { AddressRepository } from '@/core/address/domain/repositories/address.repository';
import { CityRepository } from '@/core/city/domain/repositories/city.repository';
import { Transactional } from 'typeorm-transactional';
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';

type Input = {
  id: string;
  name: string;
  cpf: string;
  phoneNumber: string;
  email: string;
  address: CreateAddressInput;
};

type Output = CustomerOutput;

export class UpdateCustomerUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
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
    const company = loggedUser.company;

    const customer = await this.customerRepository.findCustomerByIdAndCompanyId(
      input.id,
      company.id,
    );

    if (!customer) {
      throw new NotFoundError('Cliente não encontrado');
    }

    if (input.cpf !== customer.cpf) {
      const existingCustomer =
        await this.customerRepository.findCustomerByCpfAndCompanyId(
          input.cpf,
          company.id,
          customer.id,
        );

      if (existingCustomer) {
        throw new ConflictError('Já existe um cliente cadastrado com esse CPF');
      }
    }

    const city = await this.cityRepository.findById(input.address.cityId);

    if (!city) {
      throw new NotFoundError('Cidade não encontrada');
    }

    customer.address.cep = input.address.cep;
    customer.address.neighborhood = input.address.neighborhood;
    customer.address.street = input.address.street;
    customer.address.number = input.address.number;
    customer.address.complement = input.address.complement;
    customer.address.latitude = input.address.latitude ?? null;
    customer.address.longitude = input.address.longitude ?? null;
    customer.address.city = city;

    await this.addressRepository.update(customer.address);

    customer.update({
      name: input.name,
      cpf: input.cpf,
      phoneNumber: input.phoneNumber,
      email: input.email,
      updatedBy: loggedUser.id,
    });

    await this.customerRepository.update(customer);

    return this.output(customer);
  }

  private output(customer: Customer): Output {
    return {
      id: customer.id,
      name: customer.name,
      cpf: customer.cpf,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
      active: customer.active,
      address: customer.address,
    };
  }
}
