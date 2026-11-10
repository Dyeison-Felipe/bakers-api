import { endOfBusinessDay, startOfBusinessDay } from './business-date';

// Início/fim do dia "de hoje" no horário de Brasília, não no fuso do
// processo Node (UTC em produção). Veja business-date.ts.
export function getBusinessTodayRange(now: Date = new Date()): {
  startOfDay: Date;
  endOfDay: Date;
} {
  return {
    startOfDay: startOfBusinessDay(now),
    endOfDay: endOfBusinessDay(now),
  };
}
