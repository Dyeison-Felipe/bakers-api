import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../all-exceptions.filter';
import { PlanExpiredError } from '@/shared/application/errors/plan-expired-error';

const makeHost = () => {
  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
  const request = { url: '/api/v1/test', method: 'GET' };
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => reply,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, reply };
};

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeAll(() => {
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
  });

  it('traduz rota inexistente do Nest', () => {
    const { host, reply } = makeHost();
    filter.catch(new NotFoundException('Cannot GET /api/v1/nada'), host);

    expect(reply.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Rota não encontrada.' }),
    );
  });

  it('traduz erro do ParseUUIDPipe', async () => {
    const { host, reply } = makeHost();
    const error = await new ParseUUIDPipe()
      .transform('abc', { type: 'param' })
      .catch((e: unknown) => e);

    filter.catch(error, host);

    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Identificador inválido.' }),
    );
  });

  it('mantém mensagens já em português', () => {
    const { host, reply } = makeHost();
    filter.catch(new BadRequestException('Produto não encontrado'), host);

    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Produto não encontrado' }),
    );
  });

  it('preserva campos extras como o code do PlanExpiredError', () => {
    const { host, reply } = makeHost();
    filter.catch(new PlanExpiredError(), host);

    expect(reply.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PLAN_EXPIRED' }),
    );
  });

  it('traduz erro do Fastify de arquivo grande demais', () => {
    const { host, reply } = makeHost();
    const error = Object.assign(new Error('request file too large'), {
      statusCode: 413,
    });

    filter.catch(error, host);

    expect(reply.status).toHaveBeenCalledWith(413);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'O arquivo enviado é muito grande (máximo de 5MB).',
      }),
    );
  });

  it('erro inesperado vira 500 genérico sem vazar detalhes', () => {
    const { host, reply } = makeHost();
    filter.catch(new TypeError("Cannot read properties of undefined (reading 'id')"), host);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Erro interno do servidor. Tente novamente mais tarde.',
      }),
    );
  });
});
