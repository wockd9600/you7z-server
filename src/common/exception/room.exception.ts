import { ErrorCode } from '../errors';
import { INVALID_ROOM, USER_CANNOT_JOIN_ROOM } from '../errors/room.error';
import { ServiceException } from './service.exception';

export class GameRoomException extends ServiceException {
  constructor(errorCode: ErrorCode, message?: string) {
    super(errorCode, message);
  }
}

export class UserCannotJoinRoomException extends GameRoomException {
  constructor(message?: string) {
    super(USER_CANNOT_JOIN_ROOM, message);
  }
}

export class InvalidRoomException extends GameRoomException {
  constructor(message?: string) {
    super(INVALID_ROOM, message);
  }
}
