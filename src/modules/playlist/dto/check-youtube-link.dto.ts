import { IsNotEmpty, IsUrl } from 'class-validator';

export class YoutubeLinktDto {
  @IsNotEmpty()
  @IsUrl()
  public url: string;
}

export class CheckYoutubeLinkResponseDto {
  @IsNotEmpty()
  @IsUrl()
  public title: string;
  public thumbnails: string;
  public duration: string;
}
