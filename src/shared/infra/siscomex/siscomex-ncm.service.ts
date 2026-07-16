// infra/providers/siscomex/siscomex-ncm.provider.ts
import {
  NcmRawData,
  SiscomexService,
} from '@/shared/application/siscomex/siscomex-ncm.interface';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pipeline } from 'stream/promises';

interface SiscomexResponseItem {
  Codigo: string;
  Descricao: string;
}

interface SiscomexResponse {
  Nomenclaturas: SiscomexResponseItem[];
}

export class SiscomexServiceImpl implements SiscomexService {
  private readonly logger = new Logger(SiscomexServiceImpl.name);
  private readonly url =
    'https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO';

  async fetchAll(): Promise<NcmRawData[]> {
    this.logger.log('Buscando tabela NCM no Siscomex...');

    const tempFilePath = path.join(os.tmpdir(), `ncm-${Date.now()}.json`);

    try {
      // 1. Baixa o arquivo de verdade pro disco
      await this.downloadToFile(this.url, tempFilePath);
      this.logger.log(`Arquivo baixado em: ${tempFilePath}`);

      // 2. Lê o arquivo do disco
      const rawText = fs.readFileSync(tempFilePath, 'utf-8');
      this.logger.log(`Tamanho do arquivo: ${rawText.length} caracteres`);

      // 3. Faz o parse
      const data: SiscomexResponse = JSON.parse(rawText);
      this.logger.log(`Total de itens brutos: ${data.Nomenclaturas.length}`);

      const mapeados = data.Nomenclaturas.filter((item) => !!item.Codigo).map(
        (item) => ({
          code: item.Codigo.replace(/\./g, '').trim(),
          description: (item.Descricao ?? '').trim(),
        }),
      );

      const invalidos = mapeados.filter((item) => !/^\d{8}$/.test(item.code));
      if (invalidos.length > 0) {
        this.logger.warn(
          `${invalidos.length} códigos inválidos ignorados: ${JSON.stringify(invalidos.slice(0, 10))}`,
        );
      }

      return mapeados.filter((item) => /^\d{8}$/.test(item.code));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Falha ao processar tabela NCM: ${err.message}`,
        err.stack,
      );
      throw err;
    } finally {
      // 4. Limpa o arquivo temporário
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  private async downloadToFile(url: string, destPath: string): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      if (!response.ok || !response.body) {
        const bodyText = await response.text().catch(() => '');
        this.logger.error(
          `Corpo da resposta de erro: ${bodyText.slice(0, 500)}`,
        );
        throw new Error(`Siscomex retornou status ${response.status}`);
      }

      const fileStream = fs.createWriteStream(destPath);
      await pipeline(response.body as any, fileStream);
    } finally {
      clearTimeout(timeout);
    }
  }
}
