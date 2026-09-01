import { HttpException, HttpStatus } from '@nestjs/common';

const DEFAULT_MESSAGE = 'Esta conta já está logada em outro navegador.';

export class SessionConflictError extends HttpException {
  constructor(message: string = DEFAULT_MESSAGE) {
    super(
      { statusCode: HttpStatus.UNAUTHORIZED, code: 'SESSION_CONFLICT', message },
      HttpStatus.UNAUTHORIZED,
    );
    this.name = 'SessionConflictError';
  }
}
