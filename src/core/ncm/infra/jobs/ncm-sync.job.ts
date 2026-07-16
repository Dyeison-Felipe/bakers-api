import { Injectable, Logger } from '@nestjs/common';
import { SyncNcmUseCase } from '../../application/usecase/sync-ncm.usecase';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NcmSyncJob {
  private readonly logger = new Logger(NcmSyncJob.name);

  constructor(private readonly syncNcmUseCase: SyncNcmUseCase) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleSync(): Promise<void> {
    this.logger.log('Iniciando job de sincronização da tabela NCM');
    try {
      await this.syncNcmUseCase.execute();
    } catch (error) {
      this.logger.error('Falha na sincronização da tabela NCM', error);
    }
  }
}
