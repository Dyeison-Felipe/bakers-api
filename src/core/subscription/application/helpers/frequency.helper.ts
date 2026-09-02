export type MercadoPagoFrequency = {
  frequency: number;
  frequencyType: 'days' | 'months';
};

// plan.duration é sempre em dias — o Mercado Pago só aceita frequency_type
// "days" ou "months". Durações múltiplas de 30 viram meses (mais legível no
// painel do MP, ex: "a cada 6 meses" em vez de "a cada 180 dias").
export function daysToMercadoPagoFrequency(
  durationInDays: number,
): MercadoPagoFrequency {
  if (durationInDays % 30 === 0) {
    return { frequency: durationInDays / 30, frequencyType: 'months' };
  }

  return { frequency: durationInDays, frequencyType: 'days' };
}
