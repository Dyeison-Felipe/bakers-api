import { createHmac, timingSafeEqual } from 'crypto';

type VerifyParams = {
  signatureHeader: string | undefined;
  requestId: string | undefined;
  dataId: string | undefined;
  secret: string;
};

// Formato documentado pelo Mercado Pago: o header x-signature vem como
// "ts=<epoch-ms>,v1=<hmac-sha256-hex>". O manifest assinado é
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" — ver
// https://www.mercadopago.com.br/developers/en/docs/.../webhooks
// (validado contra o simulador de webhooks do MP e contra uma cobrança real
// de sandbox — 01/09/2026).
export function verifyMercadoPagoSignature({
  signatureHeader,
  requestId,
  dataId,
  secret,
}: VerifyParams): boolean {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key?.trim(), value?.trim()];
    }),
  );

  const ts = parts.ts;
  const receivedSignature = parts.v1;

  if (!ts || !receivedSignature) return false;

  // Campos ausentes entram vazios no manifest (chave mantida, valor em
  // branco) — o MP assina assim mesmo quando data.id/request-id não vêm
  // preenchidos (ex.: teste de webhook "vazio" disparado pelo painel).
  const manifest = `id:${dataId ?? ''};request-id:${requestId ?? ''};ts:${ts};`;
  const expectedSignature = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(receivedSignature, 'hex');

  // timingSafeEqual lança se os buffers tiverem tamanhos diferentes — uma
  // assinatura recebida malformada/truncada já não é igual, então tratamos
  // esse caso como "não bate" em vez de deixar a exceção vazar.
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
