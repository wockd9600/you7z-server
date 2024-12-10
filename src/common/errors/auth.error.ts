import { HttpStatus } from '@nestjs/common';
import { ErrorCodeVo } from './error-code';

export const INVALID_TOKEN = new ErrorCodeVo(
  HttpStatus.UNAUTHORIZED,
  'invalid access token',
);
export const MISMATCH_REFRESH_TOKEN = new ErrorCodeVo(
  HttpStatus.UNAUTHORIZED,
  'refresh token mismatch',
);
