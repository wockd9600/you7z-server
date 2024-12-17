import { ErrorCode } from '../errors';
import { PlaylistNotFound } from '../errors/playlist.error';
import { ServiceException } from './service.exception';

export class PlaylistException extends ServiceException {
  constructor(errorCode: ErrorCode, message?: string) {
    super(errorCode, message);
  }
}

export class NotFoundPlaylistException extends PlaylistException {
  constructor(message?: string) {
    super(PlaylistNotFound, message);
  }
}
