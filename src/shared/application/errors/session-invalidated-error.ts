import { HttpException, HttpStatus } from '@nestjs/common';

const DEFAULT_MESSAGE = 'Sua conta foi acessada por outro dispositivo.';

export class SessionInvalidatedError extends HttpException {
  constructor(message: string = DEFAULT_MESSAGE) {
    super(
      { statusCode: HttpStatus.UNAUTHORIZED, code: 'SESSION_INVALIDATED', message },
      HttpStatus.UNAUTHORIZED,
    );
    this.name = 'SessionInvalidatedError';
  }
}
