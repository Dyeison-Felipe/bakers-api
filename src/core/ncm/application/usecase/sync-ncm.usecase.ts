// application/use-cases/sync-ncm.use-case.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { SiscomexService } from '@/shared/application/siscomex/siscomex-ncm.interface';
import { NcmRepository } from '@/core/ncm/domain/repositories/ncm.repository';
import { Ncm } from '@/core/ncm/domain/entities/ncm.entity';
import { UseCase } from '@/shared/application/usecase/usecase';

type Input = void;
type Output = void;

const BATCH_SIZE = 100;

@Injectable()
export class SyncNcmUseCase implements UseCase<Input, Output> {
  private readonly logger = new Logger(SyncNcmUseCase.name);
  private isRunning = false;

  constructor(
    @Inject(PROVIDERS.SISCOMEX_SERVICE)
    private readonly siscomexService: SiscomexService,
    @Inject(PROVIDERS.NCM_REPOSITORY)
    private readonly ncmRepository: NcmRepository,
  ) {}

  async execute(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Sincronização já está em andamento, ignorando nova chamada');
      return;
    }

    this.isRunning = true;

    try {
      this.logger.log('Iniciando busca dos dados no Siscomex...');
      const rawData = await this.siscomexService.fetchAll();
      this.logger.log(`Dados recebidos do Siscomex: ${rawData.length} códigos válidos`);

      if (!rawData.length) {
        this.logger.warn('Nenhum dado retornado pelo Siscomex, sincronização abortada');
        return;
      }

      this.logger.log('Verificando quais códigos já existem no banco...');
      const codes = rawData.map((item) => item.code);
      const existingNcms = await this.ncmRepository.findManyByCodes(codes);
      const existingByCode = new Map(existingNcms.map((ncm) => [ncm.code, ncm]));
      this.logger.log(
        `${existingNcms.length} códigos já existiam, ${rawData.length - existingNcms.length} são novos`,
      );

      const entities: Ncm[] = rawData.map((raw) => {
        const existing = existingByCode.get(raw.code);

        if (existing) {
          existing.updateDescription(raw.description);
          return existing;
        }

        return Ncm.create({ code: raw.code, description: raw.description });
      });

      const totalBatches = Math.ceil(entities.length / BATCH_SIZE);
      this.logger.log(`Gravando ${entities.length} registros em ${totalBatches} lotes de ${BATCH_SIZE}...`);

      for (let i = 0; i < entities.length; i += BATCH_SIZE) {
        const batch = entities.slice(i, i + BATCH_SIZE);
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1;

        await this.ncmRepository.saveMany(batch);

        this.logger.log(
          `Lote ${currentBatch}/${totalBatches} salvo (${batch.length} registros, ${i + batch.length}/${entities.length} no total)`,
        );
      }

      this.logger.log(`Sincronização concluída: ${entities.length} códigos NCM processados`);
    } finally {
      this.isRunning = false;
    }
  }
}