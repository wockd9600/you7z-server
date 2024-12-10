import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class SongDto {
  @IsNotEmpty()
  @IsString()
  youtubeLink: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in the format HH:MM:SS',
  })
  startTime: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 128)
  answer: string;

  @IsOptional()
  @IsString()
  @Length(0, 128)
  description: string;
}
