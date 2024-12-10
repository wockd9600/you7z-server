import { ErrorCode } from '../errors';
import { INVALID_TOKEN, MISMATCH_REFRESH_TOKEN } from '../errors/auth.error';
import { ServiceException } from './service.exception';

export class AuthException extends ServiceException {
  constructor(errorCode: ErrorCode, message?: string) {
    super(errorCode, message);
  }
}

export class InvalidTokenException extends AuthException {
  constructor(message?: string) {
    super(INVALID_TOKEN, message);
  }
}

export class MismatchRefreshTokenException extends AuthException {
  constructor(message?: string) {
    super(MISMATCH_REFRESH_TOKEN, message);
  }
}
