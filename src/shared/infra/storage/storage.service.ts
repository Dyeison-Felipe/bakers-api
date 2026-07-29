// shared/infra/storage/storage.service.ts
import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EnvConfigService } from '@/shared/infra/env-config/env-config.service';
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { StorageService } from '@/shared/application/storage/storage.service';
import { PROVIDERS } from '@/shared/application/constants/providers';

@Injectable()
export class StorageServiceImpl implements StorageService {
  private readonly pathStorage: string;

  constructor(
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfig: EnvConfigService,
  ) {
    this.pathStorage = envConfig.getStoragePath();
  }

  private getCompanyProductDir(companyId: string): string {
    const dir = path.join(this.pathStorage, 'company', companyId, 'product');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  saveProductImage(companyId: string, file: MulterFile): string {
    const dir = this.getCompanyProductDir(companyId);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;

    fs.writeFileSync(path.join(dir, filename), file.buffer);

    return filename;
  }

  getProductImagePath(companyId: string, filename: string): string {
    return path.join(this.getCompanyProductDir(companyId), filename);
  }

  deleteProductImage(companyId: string, filename: string): void {
    const fullPath = this.getProductImagePath(companyId, filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
