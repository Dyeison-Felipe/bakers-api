// shared/infra/storage/storage.service.ts
import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import WebSocket from 'ws';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnvConfigService } from '@/shared/infra/env-config/env-config.service';
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { StorageService } from '@/shared/application/storage/storage.service';
import { PROVIDERS } from '@/shared/application/constants/providers';

@Injectable()
export class StorageServiceImpl implements StorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfig: EnvConfigService,
  ) {
    this.supabase = createClient(
      envConfig.getSupabaseUrl(),
      envConfig.getSupabaseServiceKey(),
      {
        auth: { persistSession: false },
        // Node < 22 não tem WebSocket nativo; o supabase-js inicializa um
        // RealtimeClient internamente mesmo só usando Storage, e quebra sem
        // essa implementação — não usamos Realtime, é só pra satisfazer o construtor.
        realtime: { transport: WebSocket as unknown as never },
      },
    );
    this.bucket = envConfig.getSupabaseStorageBucket();
  }

  private buildKey(companyId: string, folder: string, filename: string): string {
    return `company/${companyId}/${folder}/${filename}`;
  }

  async upload(
    companyId: string,
    folder: string,
    file: MulterFile,
  ): Promise<string> {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
    const key = this.buildKey(companyId, folder, filename);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Falha ao enviar arquivo para o storage: ${error.message}`);
    }

    return key;
  }

  async uploadBuffer(
    companyId: string,
    folder: string,
    filename: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const key = this.buildKey(companyId, folder, filename);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, buffer, { contentType, upsert: true });

    if (error) {
      throw new Error(`Falha ao enviar arquivo para o storage: ${error.message}`);
    }

    return key;
  }

  async download(key: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(key);

    if (error || !data) {
      throw new Error(`Arquivo não encontrado no storage: ${key}`);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucket).remove([key]);

    if (error) {
      throw new Error(`Falha ao remover arquivo do storage: ${error.message}`);
    }
  }
}
