import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { AddressModule } from '@/core/address/infra/address.module';
import { CityModule } from '@/core/city/infra/city.module';
import { AddressRepository } from '@/core/address/domain/repositories/address.repository';
import { CityRepository } from '@/core/city/domain/repositories/city.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { CustomerPersistenceModule } from './customer-persistence.module';
import { CustomerRepository } from '../domain/repositories/customer.repository';
import { CustomerController } from './controllers/customer.controller';
import { CreateCustomerUseCase } from '../application/usecase/create-customer.usecase';
import { UpdateCustomerUseCase } from '../application/usecase/update-customer.usecase';
import { FindCustomerByIdUseCase } from '../application/usecase/find-customer-by-id.usecase';
import { FindAllCustomersUseCase } from '../application/usecase/find-all-customers.usecase';
import { InactivateCustomerUseCase } from '../application/usecase/inactivate-customer.usecase';

@Module({
  imports: [CustomerPersistenceModule, AddressModule, CityModule],
  controllers: [CustomerController],
  providers: [
    {
      provide: CreateCustomerUseCase,
      useFactory: (
        customerRepository: CustomerRepository,
        addressRepository: AddressRepository,
        cityRepository: CityRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new CreateCustomerUseCase(
          customerRepository,
          addressRepository,
          cityRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CUSTOMER_REPOSITORY,
        PROVIDERS.ADDRESS_REPOSITORY,
        PROVIDERS.CITY_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: UpdateCustomerUseCase,
      useFactory: (
        customerRepository: CustomerRepository,
        addressRepository: AddressRepository,
        cityRepository: CityRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new UpdateCustomerUseCase(
          customerRepository,
          addressRepository,
          cityRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CUSTOMER_REPOSITORY,
        PROVIDERS.ADDRESS_REPOSITORY,
        PROVIDERS.CITY_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindCustomerByIdUseCase,
      useFactory: (
        customerRepository: CustomerRepository,
        loggedUserService: LoggedUserService,
      ) => new FindCustomerByIdUseCase(customerRepository, loggedUserService),
      inject: [PROVIDERS.CUSTOMER_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindAllCustomersUseCase,
      useFactory: (
        customerRepository: CustomerRepository,
        loggedUserService: LoggedUserService,
      ) => new FindAllCustomersUseCase(customerRepository, loggedUserService),
      inject: [PROVIDERS.CUSTOMER_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: InactivateCustomerUseCase,
      useFactory: (
        customerRepository: CustomerRepository,
        loggedUserService: LoggedUserService,
      ) => new InactivateCustomerUseCase(customerRepository, loggedUserService),
      inject: [PROVIDERS.CUSTOMER_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [],
})
export class CustomerModule {}
