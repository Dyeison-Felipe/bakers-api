import { MulterFile } from './multer-file.type';

export interface StorageService {
  // getCompanyProductDir(companyId: string): string;
  saveProductImage(companyId: string, file: MulterFile): string;
  getProductImagePath(companyId: string, filename: string): string;
  deleteProductImage(companyId: string, filename: string): void;
}
