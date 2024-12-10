import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { PlayListDto } from './playlist.dto';
import { SongDto } from '.';

export class PlaylistCreatetDto {
  @ValidateNested()
  @Type(() => PlayListDto)
  public playlist: PlayListDto;

  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SongDto)
  public songs: SongDto[];
}
