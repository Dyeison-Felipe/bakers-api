import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { Public } from '@/shared/infra/decorators/permission.decorator';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { MercadoPagoService } from '@/shared/application/mercado-pago/mercado-pago.service';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { verifyMercadoPagoSignature } from '@/shared/infra/mercado-pago/verify-webhook-signature';
import { ConfirmSubscriptionPaymentUseCase } from '../../application/usecase/confirm-subscription-payment.usecase';
import { MercadoPagoWebhookDto } from '../dtos/mercado-pago-webhook.dto';

const SUBSCRIPTION_PAYMENT_TOPICS = ['payment', 'subscription_authorized_payment'];

@ApiExcludeController()
@Controller('v1/webhooks/mercado-pago')
export class MercadoPagoWebhookController {
  constructor(
    private readonly confirmSubscriptionPaymentUseCase: ConfirmSubscriptionPaymentUseCase,
    @Inject(PROVIDERS.MERCADO_PAGO_SERVICE)
    private readonly mercadoPagoService: MercadoPagoService,
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfigService: EnvConfig,
  ) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body() dto: MercadoPagoWebhookDto,
    @Query('topic') topicQuery: string | undefined,
    @Query('data.id') dataIdQuery: string | undefined,
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
  ): Promise<void> {
    // O Mercado Pago manda o id do recurso como query string (?data.id=...)
    // na URL do webhook, não no corpo — o body só é usado como fallback pra
    // formatos de notificação que também o preenchem.
    const dataId = dto.data?.id ?? dataIdQuery;

    const isValid = verifyMercadoPagoSignature({
      signatureHeader: signature,
      requestId,
      dataId,
      secret: this.envConfigService.getMercadoPagoWebhookSecret(),
    });

    if (!isValid) {
      throw new UnauthorizedError('Assinatura do webhook inválida');
    }

    const topic = dto.type ?? topicQuery;

    if (!topic || !SUBSCRIPTION_PAYMENT_TOPICS.includes(topic) || !dataId) {
      return;
    }

    const payment = await this.mercadoPagoService.getPayment(dataId);

    if (!payment.subscriptionId) {
      // Pagamento avulso, sem vínculo com uma assinatura — não é dessa feature.
      return;
    }

    await this.confirmSubscriptionPaymentUseCase.execute({
      mercadoPagoSubscriptionId: payment.subscriptionId,
      approved: payment.status === 'approved',
      mercadoPagoPaymentId: payment.id,
      paymentStatus: payment.status,
      paymentStatusDetail: payment.statusDetail,
      amount: payment.transactionAmount,
    });
  }
}
