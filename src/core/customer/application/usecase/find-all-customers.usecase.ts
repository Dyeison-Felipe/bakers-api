import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { CustomerOutput } from '@/shared/application/output/customer/customer.output';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { CustomerRepository } from '../../domain/repositories/customer.repository';

type Input = {
  search?: string;
  pagination?: PaginationInput;
};

type Output = Pagination<CustomerOutput>;

export class FindAllCustomersUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ search, pagination }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const customers = await this.customerRepository.findAllByCompanyId(
      loggedUser.company.id,
      search,
      pagination,
    );

    return {
      items: customers.items.map((customer) => ({
        id: customer.id,
        name: customer.name,
        cpf: customer.cpf,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        active: customer.active,
        address: customer.address,
      })),
      meta: customers.meta,
    };
  }
}
