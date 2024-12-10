import { Playlist } from '@prisma/client';
import { PlayListDto } from '../dto';

export class PlaylistMapper {
  static toPlaylistDto(playlist: Playlist): PlayListDto {
    return new PlayListDto(playlist);
  }

  static toPlaylistDtos(playlists: Playlist[]): PlayListDto[] {
    return playlists.map(this.toPlaylistDto);
  }
}
