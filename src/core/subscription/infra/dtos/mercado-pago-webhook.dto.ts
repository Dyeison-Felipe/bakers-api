import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

// Payload do webhook do Mercado Pago — corpo mínimo (notificação "fina":
// só o id do recurso, o estado completo é buscado via GET depois).
// O ValidationPipe global usa whitelist: true, então todo campo sem
// decorator de class-validator é removido do body antes de chegar no
// controller — os decorators aqui não são opcionais.
export class MercadoPagoWebhookDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class MercadoPagoWebhookDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  action?: string;

  // Opcional porque nem toda notificação do MP preenche o body (a "ping"
  // de teste do painel manda body vazio, com o id só na query string).
  @IsOptional()
  @ValidateNested()
  @Type(() => MercadoPagoWebhookDataDto)
  data?: MercadoPagoWebhookDataDto;
}
