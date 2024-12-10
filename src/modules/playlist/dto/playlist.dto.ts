import { Playlist } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PlayListDto {
  @IsOptional()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  length: number;

  @IsOptional()
  @IsNumber()
  download_count: number;

  constructor(playlist: Playlist) {
    if (!playlist) return;

    const { playlist_id, title, description, length, download_count } =
      playlist;
    this.title = title;
    this.description = description;
    this.id = playlist_id;
    this.length = length;
    this.download_count = download_count;
    // this.downloaded = downloaded;
  }
}
