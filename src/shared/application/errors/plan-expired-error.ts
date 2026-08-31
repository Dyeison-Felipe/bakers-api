import { HttpException, HttpStatus } from '@nestjs/common';

const DEFAULT_MESSAGE =
  'O plano da sua empresa expirou. Adquira um novo plano para continuar utilizando o sistema.';

export class PlanExpiredError extends HttpException {
  constructor(message: string = DEFAULT_MESSAGE) {
    super(
      { statusCode: HttpStatus.FORBIDDEN, code: 'PLAN_EXPIRED', message },
      HttpStatus.FORBIDDEN,
    );
    this.name = 'PlanExpiredError';
  }
}
