import { ErrorCode } from '../errors';
import {
  GAME_ROOM_NOT_FOUND,
  GAME_SESSION_NOT_FOUND,
  READY_NOT_FOUND_IN_REDIS,
  ROOM_CODE_MISSING,
  SCORE_NOT_FOUND_IN_REDIS,
  SONG_NOT_FOUND_IN_REDIS,
} from '../errors/game.error';
import { ServiceException } from './service.exception';

export class GameRoomException extends ServiceException {
  constructor(errorCode: ErrorCode, message?: string) {
    super(errorCode, message);
  }
}

export class RoomCodeMissingException extends GameRoomException {
  constructor(message?: string) {
    super(ROOM_CODE_MISSING, message);
  }
}

export class GameRoomNotFoundException extends GameRoomException {
  constructor(message?: string) {
    super(GAME_ROOM_NOT_FOUND, message);
  }
}

export class GameSessionNotFoundException extends GameRoomException {
  constructor(message?: string) {
    super(GAME_SESSION_NOT_FOUND, message);
  }
}

export class SongNotFoundException extends GameRoomException {
  constructor(message?: string) {
    super(SONG_NOT_FOUND_IN_REDIS, message);
  }
}

export class SocreNotFoundException extends GameRoomException {
  constructor(message?: string) {
    super(SCORE_NOT_FOUND_IN_REDIS, message);
  }
}

export class ReadyNotFoundException extends GameRoomException {
  constructor(message?: string) {
    super(READY_NOT_FOUND_IN_REDIS, message);
  }
}
