import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressSchema } from './database/typeorm/schema/address.schema';
import { AddressRepositoryImpl } from './database/typeorm/repository/address.repository';
import { AddressRepositoryMapper } from './database/typeorm/repository/mapper/address-repository.mapper';
// import { AddressController } from './controllers/address.controller';
import { CreateAddressUseCase } from '../application/usecase/create-address.usecase';
import { AddressRepository } from '../domain/repositories/address.repository';
import { UpdateAddressUseCase } from '../application/usecase/update-address.usecase';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { FindAddressByCompanyIdUseCase } from '../application/usecase/find-address-by-id.usecase';
import { CityModule } from '@/core/city/infra/city.module';
import { CityRepository } from '@/core/city/domain/repositories/city.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AddressSchema]), CityModule],
  // controllers: [AddressController],
  providers: [
    {
      provide: PROVIDERS.ADDRESS_REPOSITORY,
      useClass: AddressRepositoryImpl,
    },
    {
      provide: CreateAddressUseCase,
      useFactory: (
        addressRepository: AddressRepository,
        cityRepository: CityRepository,
      ) => {
        return new CreateAddressUseCase(addressRepository, cityRepository);
      },
      inject: [PROVIDERS.ADDRESS_REPOSITORY, PROVIDERS.CITY_REPOSITORY],
    },
    {
      provide: UpdateAddressUseCase,
      useFactory: (
        addressRepository: AddressRepository,
        cityRepository: CityRepository,
      ) => {
        return new UpdateAddressUseCase(addressRepository, cityRepository);
      },
      inject: [PROVIDERS.ADDRESS_REPOSITORY, PROVIDERS.CITY_REPOSITORY],
    },

    {
      provide: FindAddressByCompanyIdUseCase,
      useFactory: (addressRepository: AddressRepository) => {
        return new FindAddressByCompanyIdUseCase(addressRepository);
      },
      inject: [PROVIDERS.ADDRESS_REPOSITORY],
    },
  ],
  exports: [PROVIDERS.ADDRESS_REPOSITORY],
})
export class AddressModule {}
