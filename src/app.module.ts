import { Module } from '@nestjs/common';
import { EnvConfigModule } from './shared/infra/env-config/env-config.module';
import { DatabaseModule } from './shared/infra/database/typeorm/database.module';
import { HashModule } from './shared/infra/hash/hash.module';
import { AddressModule } from '@/core/address/infra/address.module';
import { UserModule } from '@/core/user/infra/user.module';
import { AuthModule } from '@/core/auth/infra/auth.module';
import { JwtConfigModule } from '@/shared/infra/jwt/jwt.module';
import { LoggedUserModule } from '@/shared/infra/logged-user/logged-user.module';
import { APP_GUARD } from '@nestjs/core';
import { PermissionGuard } from './core/auth/infra/guard/permission.guard';
import { MailModule } from './shared/infra/mail/mail.module';
import { CompanyModule } from './core/company/infra/company.module';
import { PlanModule } from './core/plan/infra/plan.module';
import { RoleModule } from './core/role/infra/role.module';
import { PlanPermissionModule } from './core/plan-permission/infra/plan-permission.module';
import { StateModule } from './core/state/infra/state.module';
import { CityModule } from './core/city/infra/city.module';
import { PermissionModule } from './core/permission/infra/permission.module';
import { UserPermissionModule } from './core/user-permission/infra/user-permission.module';
import { CategoryModule } from './core/category/infra/category.module';
import { ProductModule } from './core/product/infra/product.module';
import { NcmModule } from './core/ncm/infra/ncm.module';
import { SiscomexModule } from './shared/infra/siscomex/siscomex.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SiscomexModule,
    NcmModule,
    ProductModule,
    CategoryModule,
    CategoryModule,
    PlanPermissionModule,
    LoggedUserModule,
    EnvConfigModule,
    DatabaseModule,
    HashModule,
    AddressModule,
    StateModule,
    CityModule,
    UserModule,
    AuthModule,
    JwtConfigModule,
    PermissionModule,
    UserPermissionModule,
    MailModule,
    CompanyModule,
    PlanModule,
    RoleModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
