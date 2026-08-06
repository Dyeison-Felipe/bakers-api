import { PROVIDERS } from '@/shared/application/constants/providers';
import { Module } from '@nestjs/common';
import { CompanyRepositoryImpl } from './database/typeorm/repository/company.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanySchema } from './database/typeorm/schema/company.schema';
import { AddressModule } from '@/core/address/infra/address.module';
import { UserModule } from '@/core/user/infra/user.module';
import { HashModule } from '@/shared/infra/hash/hash.module';
import { RoleModule } from '@/core/role/infra/role.module';
import { PlanModule } from '@/core/plan/infra/plan.module';
import { CreateCompanyUseCase } from '../application/usecase/create-company.usecase';
import { CompanyRepository } from '../domain/repositories/company.repository';
import { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import { AddressRepository } from '@/core/address/domain/repositories/address.repository';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { RoleRepository } from '@/core/role/domain/repositories/role.repository';
import { HashService } from '@/shared/application/hash/hash.service';
import { CompanyController } from './controllers/company.controller';
import { CityModule } from '@/core/city/infra/city.module';
import { CityRepository } from '@/core/city/domain/repositories/city.repository';
import { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import { UserPermissionModule } from '@/core/user-permission/infra/user-permission.module';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { MailService } from '@/shared/application/mail/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanySchema]),
    AddressModule,
    UserModule,
    HashModule,
    RoleModule,
    PlanModule,
    CityModule,
    UserPermissionModule,
  ],
  controllers: [CompanyController],
  providers: [
    {
      provide: PROVIDERS.COMPANY_REPOSITORY,
      useClass: CompanyRepositoryImpl,
    },
    {
      provide: CreateCompanyUseCase,
      useFactory: (
        companyRepository: CompanyRepository,
        planRepository: PlanRepository,
        addressRepository: AddressRepository,
        userRepository: UserRepository,
        cityRepository: CityRepository,
        roleRepository: RoleRepository,
        hashService: HashService,
        userPermissionRepository: UserPermissionRepository,
        jwtService: JwtService,
        envConfigService: EnvConfig,
        mailService: MailService,
      ) => {
        return new CreateCompanyUseCase(
          companyRepository,
          planRepository,
          addressRepository,
          userRepository,
          cityRepository,
          roleRepository,
          hashService,
          userPermissionRepository,
          jwtService,
          envConfigService,
          mailService,
        );
      },
      inject: [
        PROVIDERS.COMPANY_REPOSITORY,
        PROVIDERS.PLAN_REPOSITORY,
        PROVIDERS.ADDRESS_REPOSITORY,
        PROVIDERS.USER_REPOSITORY,
        PROVIDERS.CITY_REPOSITORY,
        PROVIDERS.ROLE_REPOSITORY,
        PROVIDERS.HASH_SERVICE,
        PROVIDERS.USER_PERMISSION_REPOSITORY,
        PROVIDERS.JWT_SERVICE,
        PROVIDERS.ENV_CONFIG_SERVICE,
        PROVIDERS.MAIL_SERVICE,
      ],
    },
  ],
  exports: [PROVIDERS.COMPANY_REPOSITORY],
})
export class CompanyModule {}
