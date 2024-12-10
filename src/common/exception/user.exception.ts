import { ErrorCode } from '../errors';
import { UserNotFound } from '../errors/user.error';
import { ServiceException } from './service.exception';

export class UserException extends ServiceException {
  constructor(errorCode: ErrorCode, message?: string) {
    super(errorCode, message);
  }
}

export class NotFoundUserException extends UserException {
  constructor(message?: string) {
    super(UserNotFound, message);
  }
}
