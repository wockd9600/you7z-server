import { ErrorCodeVo } from './error-code';

export const UserNotFound = new ErrorCodeVo(404, 'not found user');
export const UserProfileNotFound = new ErrorCodeVo(
  404,
  'not found user profile',
);
