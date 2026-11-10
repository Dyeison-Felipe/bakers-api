import { ValueTransformer } from 'typeorm';
import {
  startOfBusinessDate,
  toBusinessDateString,
} from '@/shared/infra/utils/business-date';

// Colunas `date` (sem hora). Na aplicação o dia é um Date à meia-noite de
// Brasília. No banco vai só 'YYYY-MM-DD' do dia em Brasília. Nada aqui
// depende do fuso do servidor (UTC em produção).
export class DateOnlyColumnTransformer implements ValueTransformer {
  to(data: Date | null): string | null {
    if (data === null || data === undefined) return null;

    return toBusinessDateString(data);
  }

  from(data: string | Date | null): Date | null {
    if (data === null || data === undefined) return null;

    if (data instanceof Date) {
      // O driver monta o Date com o calendário local do processo, então o
      // dia certo está nos getters locais.
      const year = data.getFullYear();
      const month = String(data.getMonth() + 1).padStart(2, '0');
      const day = String(data.getDate()).padStart(2, '0');
      return startOfBusinessDate(`${year}-${month}-${day}`);
    }

    return startOfBusinessDate(data.slice(0, 10));
  }
}
