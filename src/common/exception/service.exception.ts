import { ENTITY_NOT_FOUND, ErrorCode } from '../errors';

export const EntityNotFoundException = (message?: string): ServiceException => {
  return new ServiceException(ENTITY_NOT_FOUND, message);
};

export class ServiceException extends Error {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message?: string) {
    super(message || errorCode.message);
    this.errorCode = errorCode;
  }
}
