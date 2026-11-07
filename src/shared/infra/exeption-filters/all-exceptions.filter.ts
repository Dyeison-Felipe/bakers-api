import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import type { FastifyReply, FastifyRequest } from 'fastify';

// Mensagem padrão (pt-BR) por status HTTP.
const STATUS_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]:
    'Requisição inválida. Confira os dados e tente novamente.',
  [HttpStatus.UNAUTHORIZED]: 'Sessão expirada ou inválida. Faça login novamente.',
  [HttpStatus.FORBIDDEN]: 'Você não tem permissão para executar esta ação.',
  [HttpStatus.NOT_FOUND]: 'Recurso não encontrado.',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'Operação não permitida.',
  [HttpStatus.NOT_ACCEPTABLE]: 'Formato de resposta não suportado.',
  [HttpStatus.REQUEST_TIMEOUT]:
    'A requisição demorou demais. Tente novamente.',
  [HttpStatus.CONFLICT]: 'Conflito com dados já existentes.',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'O arquivo ou os dados enviados são muito grandes.',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'Formato de conteúdo não suportado.',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Dados inválidos.',
  [HttpStatus.TOO_MANY_REQUESTS]:
    'Muitas requisições. Tente novamente em instantes.',
  [HttpStatus.INTERNAL_SERVER_ERROR]:
    'Erro interno do servidor. Tente novamente mais tarde.',
  [HttpStatus.BAD_GATEWAY]:
    'Serviço indisponível no momento. Tente novamente mais tarde.',
  [HttpStatus.SERVICE_UNAVAILABLE]:
    'Serviço indisponível no momento. Tente novamente mais tarde.',
  [HttpStatus.GATEWAY_TIMEOUT]:
    'O serviço demorou para responder. Tente novamente.',
};

// Rótulos (pt-BR) do campo `error` da resposta.
const STATUS_LABELS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Requisição inválida',
  [HttpStatus.UNAUTHORIZED]: 'Não autorizado',
  [HttpStatus.FORBIDDEN]: 'Acesso negado',
  [HttpStatus.NOT_FOUND]: 'Não encontrado',
  [HttpStatus.CONFLICT]: 'Conflito',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'Conteúdo muito grande',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'Formato não suportado',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Dados inválidos',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Muitas requisições',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno',
};

// Mensagens padrão (em inglês) geradas pelo Nest, Fastify e plugins, que
// precisam ser traduzidas. Qualquer mensagem que bata com um destes padrões
// é trocada; mensagens escritas por nós (já em pt-BR) passam intactas.
const ENGLISH_MESSAGE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/^Cannot (GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD) /i, 'Rota não encontrada.'],
  [/^Route .* not found$/i, 'Rota não encontrada.'],
  [/Validation failed \(uuid( v\d)? is expected\)/i, 'Identificador inválido.'],
  [/Validation failed \(numeric string is expected\)/i, 'O valor informado deve ser um número.'],
  [/Validation failed \(boolean string is expected\)/i, 'O valor informado deve ser verdadeiro ou falso.'],
  [/Validation failed \(enum string is expected\)/i, 'O valor informado não é uma opção válida.'],
  [/Validation failed/i, 'Dados inválidos.'],
  [/(Body|request body) is not valid JSON|Unexpected token .* in JSON|in JSON at position|Unexpected end of JSON/i, 'O corpo da requisição não é um JSON válido.'],
  [/Body cannot be empty/i, 'O corpo da requisição não pode estar vazio.'],
  [/Unsupported Media Type|Content-Type|content type/i, 'Formato de conteúdo não suportado.'],
  [/request file too large|File too large|reach files limit|reach fields limit|reach parts limit|Request body is too large|payload too large/i, 'O arquivo enviado é muito grande (máximo de 5MB).'],
  [/the request is not multipart/i, 'A requisição deve ser enviada como formulário com arquivo (multipart).'],
  [/Too Many Requests|ThrottlerException/i, 'Muitas requisições. Tente novamente em instantes.'],
  [/^Unauthorized$|jwt (expired|malformed)|invalid (token|signature)|No auth token/i, 'Sessão expirada ou inválida. Faça login novamente.'],
  [/^Forbidden( resource)?$/i, 'Você não tem permissão para executar esta ação.'],
  [/^Not Found$/i, 'Recurso não encontrado.'],
  [/^Bad Request$/i, 'Requisição inválida. Confira os dados e tente novamente.'],
  [/^Conflict$/i, 'Conflito com dados já existentes.'],
  [/^Internal server error$/i, 'Erro interno do servidor. Tente novamente mais tarde.'],
];

const translateMessage = (message: string, status: number): string => {
  for (const [pattern, translated] of ENGLISH_MESSAGE_TRANSLATIONS) {
    if (pattern.test(message)) return translated;
  }
  return message || STATUS_MESSAGES[status] || STATUS_MESSAGES[500];
};

// Filtro "pega-tudo": garante resposta em pt-BR para qualquer erro que não
// foi tratado pelos filtros específicos (BadRequestError, NotFoundError...).
// Cobre exceções padrão do Nest (NotFoundException, ParseUUIDPipe...),
// erros do Fastify/plugins (JSON inválido, arquivo grande demais, rota
// inexistente) e erros inesperados (500), sem vazar detalhes internos.
//
// Deve ser registrado PRIMEIRO em app.useGlobalFilters(): o Nest testa os
// filtros globais do último para o primeiro, então os específicos têm
// prioridade e este só atua quando nenhum outro se aplica.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // Só respostas HTTP (WebSocket tem tratamento próprio no gateway)
    if (host.getType() !== 'http') return;

    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { status, message, extra } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    reply.status(status).send({
      statusCode: status,
      error: STATUS_LABELS[status] ?? 'Erro',
      message,
      ...extra,
      path: request.url,
    });
  }

  private resolve(exception: unknown): {
    status: number;
    message: string;
    extra: Record<string, unknown>;
  } {
    // HttpException (Nest): mantém status e campos extras (ex.: `code`)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const extra: Record<string, unknown> = {};
      let rawMessage = exception.message;

      if (body && typeof body === 'object') {
        const { message, statusCode, error, ...rest } = body as Record<
          string,
          unknown
        >;
        Object.assign(extra, rest);
        if (Array.isArray(message)) {
          rawMessage = message.filter(Boolean).join(' ');
        } else if (typeof message === 'string') {
          rawMessage = message;
        }
      } else if (typeof body === 'string') {
        rawMessage = body;
      }

      return {
        status,
        message:
          status >= 500
            ? this.serverErrorMessage(rawMessage, status)
            : translateMessage(rawMessage, status),
        extra,
      };
    }

    // Erros do Fastify/plugins trazem `statusCode` (ex.: 400 JSON inválido,
    // 413 arquivo grande, 415 content-type)
    const fastifyStatus = (exception as { statusCode?: unknown })?.statusCode;
    if (
      typeof fastifyStatus === 'number' &&
      fastifyStatus >= 400 &&
      fastifyStatus < 600
    ) {
      const rawMessage =
        exception instanceof Error ? exception.message : String(exception);
      return {
        status: fastifyStatus,
        message:
          fastifyStatus >= 500
            ? STATUS_MESSAGES[fastifyStatus] ?? STATUS_MESSAGES[500]
            : translateMessage(rawMessage, fastifyStatus),
        extra: {},
      };
    }

    // Qualquer outra coisa é inesperada: 500 genérico (detalhe só no log)
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: STATUS_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR],
      extra: {},
    };
  }

  // Em 5xx só mantém mensagens escritas por nós (pt-BR); textos padrão em
  // inglês viram a mensagem genérica.
  private serverErrorMessage(message: string, status: number) {
    const translated = translateMessage(message, status);
    if (translated !== message) return translated;
    return /[ãçéêíóúáâõà]/i.test(message) || /\b(não|erro|falha)\b/i.test(message)
      ? message
      : STATUS_MESSAGES[status] ?? STATUS_MESSAGES[500];
  }
}
