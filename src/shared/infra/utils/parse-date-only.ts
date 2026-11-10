import { endOfBusinessDate, startOfBusinessDate } from './business-date';

// Datas vindas da query/body como 'YYYY-MM-DD'. Usa o horário de Brasília,
// não o fuso do servidor (UTC em produção). Veja business-date.ts.

/** Início (meia-noite em Brasília) do dia informado. */
export function parseDateOnly(value: string): Date {
  return startOfBusinessDate(value);
}

/** Fim (23:59:59.999 em Brasília) do dia informado — para filtros "até". */
export function parseDateOnlyEndOfDay(value: string): Date {
  return endOfBusinessDate(value);
}
