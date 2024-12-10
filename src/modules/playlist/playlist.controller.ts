import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { GetPlaylistQueryDto } from './dto';

@Controller('playlist')
@UseGuards(AuthGuard)
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get('/')
  getPlaylist(
    @Query() getPlaylistDto: GetPlaylistQueryDto,
    @User('userId') userId: number,
  ) {
    return this.playlistService.getPlaylists(userId, getPlaylistDto);
  }

  // @Post('/')
  // postCreatePlaylist(
  //   @Body() createRequestDto: PlaylistCreatetDto,
  //   @User('user_id') user_id: number,
  // ) {
  //   return this.playlistService.createPlaylist(user_id, createRequestDto);
  // }

  // @Post('/checkYoutubeLink')
  // postCheckYoutubeLink(@Body() youtubeLinktDto: YoutubeLinktDto) {
  //   return this.playlistService.checkYoutubeLink(youtubeLinktDto);
  // }

  // @Post('/song')
  // postAddSong(@Body() songAddDto: SongAddDto, @User('user_id') user_id: number,) {
  //   return this.playlistService.postAddSong();
  // }

  // @Patch('/song/:id')
  // updateSong(@Param('id') song_id: number, @User('user_id') user_id: number,) {
  //   return this.playlistService.updateSong();
  // }

  // @Patch('/song/delete/:id')
  // updateSongDeleteFlag(@Param('id') song_id: number, @User('user_id') user_id: number,) {
  //   return this.playlistService.updateSongDeleteFlag();
  // }

  // @Patch('/delete/:id')
  // updatePlaylistDeleteFlag(@Param('id') playlist_id: number, @User('user_id') user_id: number,) {
  //   return this.playlistService.updatePlaylistDeleteFlag();
  // }
}
