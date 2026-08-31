import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { MailService } from '@/shared/application/mail/mail.service';
import { getErrorStack } from '@/shared/application/helpers/error.helper';

@Injectable()
export class PlanExpirationJob {
  private readonly logger = new Logger(PlanExpirationJob.name);

  constructor(
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(PROVIDERS.MAIL_SERVICE)
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiration(): Promise<void> {
    this.logger.log('Iniciando job de expiração de planos');

    const expiredCompanies =
      await this.companyRepository.findAllActiveWithExpiredPlan();

    for (const company of expiredCompanies) {
      try {
        company.setActive(false, company.updatedBy);
        await this.companyRepository.update(company);

        await this.mailService.sendMail({
          to: company.email,
          template: 'plan-expired',
          subject: 'Seu plano expirou',
          context: {
            fantasyName: company.fantasyName,
            year: new Date().getFullYear(),
          },
        });
      } catch (error) {
        this.logger.error(
          `Falha ao desativar/notificar a empresa ${company.id} por plano expirado`,
          getErrorStack(error),
        );
      }
    }

    this.logger.log(
      `Job de expiração de planos concluído: ${expiredCompanies.length} empresa(s) processada(s)`,
    );
  }
}
