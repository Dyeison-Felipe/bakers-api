// Datas "do negócio": o dia que importa é o dia em Brasília, não o dia do
// fuso em que o processo Node está rodando. Em produção o container roda em
// UTC: a partir das 21h de Brasília, o UTC já está no dia seguinte. Quem
// usava getDate()/setHours()/toISOString() direto gravava e consultava o dia
// errado (ex: despesa lançada às 22h do dia 09 salva como dia 10).
//
// Toda conversão entre um instante (Date) e um dia (YYYY-MM-DD) passa por
// aqui. Brasil não tem horário de verão desde 2019, então o offset fixo
// -03:00 é seguro.

export const BUSINESS_TIMEZONE = 'America/Sao_Paulo';
const BUSINESS_UTC_OFFSET = '-03:00';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const businessDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Dia (YYYY-MM-DD) em que o instante cai no horário de Brasília. */
export function toBusinessDateString(date: Date): string {
  return businessDateFormatter.format(date);
}

/** Meia-noite de Brasília do dia informado (YYYY-MM-DD). */
export function startOfBusinessDate(value: string): Date {
  if (!DATE_ONLY_REGEX.test(value)) {
    throw new Error(`Data inválida, esperado YYYY-MM-DD: ${value}`);
  }

  return new Date(`${value}T00:00:00.000${BUSINESS_UTC_OFFSET}`);
}

/** Último milissegundo do dia informado (YYYY-MM-DD) no horário de Brasília. */
export function endOfBusinessDate(value: string): Date {
  if (!DATE_ONLY_REGEX.test(value)) {
    throw new Error(`Data inválida, esperado YYYY-MM-DD: ${value}`);
  }

  return new Date(`${value}T23:59:59.999${BUSINESS_UTC_OFFSET}`);
}

/** Meia-noite de Brasília do dia em que o instante cai. */
export function startOfBusinessDay(date: Date): Date {
  return startOfBusinessDate(toBusinessDateString(date));
}

/** Último milissegundo, em Brasília, do dia em que o instante cai. */
export function endOfBusinessDay(date: Date): Date {
  return endOfBusinessDate(toBusinessDateString(date));
}
