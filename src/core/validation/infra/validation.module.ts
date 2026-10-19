import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { EmailDomainChecker } from '@/shared/application/email-domain/email-domain-checker.interface';
import { dnsEmailDomainChecker } from '@/shared/infra/email-domain/dns-email-domain-checker';
import { SimpleRateLimitGuard } from '@/shared/infra/guards/simple-rate-limit.guard';
import { CheckEmailDomainUseCase } from '../application/usecase/check-email-domain.usecase';
import { ValidationController } from './controllers/validation.controller';

@Module({
  controllers: [ValidationController],
  providers: [
    SimpleRateLimitGuard,
    {
      provide: PROVIDERS.EMAIL_DOMAIN_CHECKER,
      useValue: dnsEmailDomainChecker,
    },
    {
      provide: CheckEmailDomainUseCase,
      useFactory: (emailDomainChecker: EmailDomainChecker) =>
        new CheckEmailDomainUseCase(emailDomainChecker),
      inject: [PROVIDERS.EMAIL_DOMAIN_CHECKER],
    },
  ],
})
export class ValidationModule {}
