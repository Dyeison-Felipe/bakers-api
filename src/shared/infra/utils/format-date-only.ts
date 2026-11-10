import { toBusinessDateString } from './business-date';

/** Dia (YYYY-MM-DD) do instante no horário de Brasília — para colunas `date`. */
export function formatDateOnly(date: Date): string {
  return toBusinessDateString(date);
}
