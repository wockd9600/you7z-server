import { GameSession, Playlist } from '@prisma/client';

export class GameSettingDto {
  public playlist_id: number;
  public title: string;
  public description: string;
  public targetScore: number;

  constructor(gameSession: GameSession, playlist: Playlist) {
    this.playlist_id = playlist.playlistId;
    this.title = playlist.title;
    this.description = playlist.description;
    this.targetScore = gameSession.goalScore;
  }
}
