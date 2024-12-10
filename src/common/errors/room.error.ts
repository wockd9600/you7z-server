import { ErrorCodeVo } from './error-code';

export const USER_CANNOT_JOIN_ROOM = new ErrorCodeVo(
  409,
  'user cannot join room',
);
export const INVALID_ROOM = new ErrorCodeVo(500, 'invalid room');
