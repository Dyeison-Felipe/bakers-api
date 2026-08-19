import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { Transactional } from 'typeorm-transactional';
import { CustomerRepository } from '../../domain/repositories/customer.repository';

type Input = {
  id: string;
};

type Output = void;

export class InactivateCustomerUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  @Transactional()
  async execute({ id }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const customer = await this.customerRepository.findCustomerByIdAndCompanyId(
      id,
      loggedUser.company.id,
    );

    if (!customer) {
      throw new NotFoundError('Cliente não encontrado');
    }

    customer.inactivate(loggedUser.id);

    await this.customerRepository.update(customer);
  }
}
