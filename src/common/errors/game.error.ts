import { ErrorCodeVo } from './error-code';

export const ROOM_CODE_MISSING = new ErrorCodeVo(404, '방 번호가 없습니다.');
export const GAME_ROOM_NOT_FOUND = new ErrorCodeVo(
  404,
  '방이 존재하지 않습니다.',
);
export const GAME_SESSION_NOT_FOUND = new ErrorCodeVo(
  404,
  '게임 세션 정보를 찾을 수 없습니다.',
);
export const SONG_NOT_FOUND_IN_REDIS = new ErrorCodeVo(
  404,
  'No current song found',
);
export const SCORE_NOT_FOUND_IN_REDIS = new ErrorCodeVo(
  404,
  'No player score found',
);
export const READY_NOT_FOUND_IN_REDIS = new ErrorCodeVo(
  404,
  '`No player ready found',
);
