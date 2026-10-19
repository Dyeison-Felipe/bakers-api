import { Inject, Injectable } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { EmailDomainChecker } from '@/shared/application/email-domain/email-domain-checker.interface';
import { UseCase } from '@/shared/application/usecase/usecase';

type Input = { email: string };
type Output = { valid: boolean };

@Injectable()
export class CheckEmailDomainUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.EMAIL_DOMAIN_CHECKER)
    private readonly emailDomainChecker: EmailDomainChecker,
  ) {}

  async execute({ email }: Input): Promise<Output> {
    const valid = await this.emailDomainChecker.hasValidDomain(email);
    return { valid };
  }
}
