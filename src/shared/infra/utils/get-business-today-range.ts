const BUSINESS_TIMEZONE = 'America/Sao_Paulo';

// Calcula o início/fim do dia "de hoje" no fuso horário do negócio
// (America/Sao_Paulo), não no fuso do processo Node. Em produção o servidor
// roda em UTC — usar `new Date().getFullYear()/getMonth()/getDate()` direto
// pega o dia em UTC, que vira "amanhã" 3h mais cedo que o horário de
// Brasília (21h). Resultado: dados de vendas do dia sumiam do Dashboard
// exatamente às 21h, porque a janela "hoje" pulava pro dia seguinte antes
// da meia-noite local. Brasil não observa mais horário de verão desde 2019,
// então o offset fixo -03:00 é seguro (sem precisar de lib de timezone).
export function getBusinessTodayRange(now: Date = new Date()): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // 'YYYY-MM-DD'

  return {
    startOfDay: new Date(`${ymd}T00:00:00.000-03:00`),
    endOfDay: new Date(`${ymd}T23:59:59.999-03:00`),
  };
}
