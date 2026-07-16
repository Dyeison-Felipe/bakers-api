export type NcmRawData = {
  code: string;
  description: string;
}

export interface SiscomexService {
  fetchAll(): Promise<NcmRawData[]>;
}