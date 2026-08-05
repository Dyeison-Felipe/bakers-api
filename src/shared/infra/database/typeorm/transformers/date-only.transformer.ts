import { ValueTransformer } from 'typeorm';

export class DateOnlyColumnTransformer implements ValueTransformer {
  // Serializa como string 'YYYY-MM-DD' usando o calendário local — se
  // deixado como objeto Date, a conversão para o driver do Postgres pode
  // aplicar timezone e gravar o dia anterior (ex: meia-noite local virando
  // o dia de antes em UTC).
  to(data: Date | null): string | null {
    if (data === null || data === undefined) return null;

    const year = data.getFullYear();
    const month = String(data.getMonth() + 1).padStart(2, '0');
    const day = String(data.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  from(data: string | Date | null): Date | null {
    if (data === null || data === undefined) return null;
    return data instanceof Date ? data : new Date(data);
  }
}
