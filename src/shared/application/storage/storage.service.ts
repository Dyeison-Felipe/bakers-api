import { MulterFile } from './multer-file.type';

export interface StorageService {
  upload(companyId: string, folder: string, file: MulterFile): Promise<string>;
  uploadBuffer(
    companyId: string,
    folder: string,
    filename: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
