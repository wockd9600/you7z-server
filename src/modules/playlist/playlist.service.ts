import { Injectable } from '@nestjs/common';
import { GetPlaylistQueryDto, PlayListDto } from './dto';
import { PrismaService } from '../core/prisma/prisma.service';
import { getOffsetAndLimit } from 'src/modules/playlist/common/pagination.util';
import { PlaylistMapper } from './common/playlist.mapper';
import { buildPlaylistWhereCondition } from './common/playlist-conditions.helper';
import { Playlist } from '@prisma/client';
import { NotFoundPlaylistException } from 'src/common/exception/playlist.exception';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlaylists(
    userId: number,
    { page, type, search_term }: GetPlaylistQueryDto,
  ): Promise<PlayListDto[]> {
    try {
      const { limit, offset } = getOffsetAndLimit(page);

      const whereCondition = buildPlaylistWhereCondition(
        userId,
        type,
        search_term,
      );
      const playlists = await this.prisma.playlist.findMany({
        where: whereCondition,
        orderBy: {
          download_count: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const playlistDtos = PlaylistMapper.toPlaylistDtos(playlists);
      return playlistDtos;
    } catch (error) {
      throw error;
    }
  }

  async findPlaylistByPlaylistId(playlistId: number): Promise<Playlist> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { playlistId },
    });
    if (!playlist)
      throw new NotFoundPlaylistException(
        `playlist id ${playlistId} not found`,
      );
    return playlist;
  }

  // getYoutubeVideoId(url: string) {
  //   const regex =
  //     /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/;
  //   const match = url.match(regex);
  //   return match ? match[1] : null;
  // }

  // async createPlaylist(user_id: number, createRequestDto: PlaylistCreatetDto) {
  //   const { playlist, songs } = createRequestDto;

  //   const transaction = await sequelize.transaction();

  //   try {
  //     const length = songs.length;

  //     const playlistData = new Playlist({ ...playlist, user_id, length });
  //     const user_playlist = await this.playlistRepository.createPlaylist(
  //       playlistData,
  //       transaction,
  //     );

  //     const songEntities = songs.map((song) => {
  //       const videoId = this.getYoutubeVideoId(song.youtubeLink);
  //       if (!videoId) throw new Error('유효한 YouTube URL이 아닙니다.');

  //       return new Song({
  //         ...song,
  //         playlist_id: user_playlist.playlist_id,
  //         url: videoId,
  //         start_time: song.startTime,
  //       });
  //     });

  //     await this.playlistRepository.bulkCreateSong(songEntities, transaction);

  //     // const userPlaylistData = new UserPlaylist({
  //     //     playlist_id: user_playlist.playlist_id,
  //     //     user_id,
  //     // });

  //     // await this.playlistRepository.createUserPlaylist(userPlaylistData, transaction);

  //     await transaction.commit();

  //     return { status: HttpStatus.OK, message: '이름 변경 완료' };
  //   } catch (error) {
  //     await transaction.rollback();
  //     throw error;
  //   }
  // }

  // async checkYoutubeLink(
  //   youtubeLinktDto: YoutubeLinktDto,
  // ): Promise<CheckYoutubeLinkResponseDto> {
  //   const { url } = youtubeLinktDto;

  //   try {
  //     const videoId = this.getYoutubeVideoId(url);
  //     if (!videoId) throw new Error('유효한 YouTube URL이 아닙니다.');

  //     const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  //     const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${YOUTUBE_API_KEY}`;
  //     const config = {
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     };
  //     const response = await axios.get(apiUrl, config);
  //     const item = response.data.items[0];
  //     const responseData = new CheckYoutubeLinkResponseDto();
  //     responseData.title = item.snippet.title;
  //     responseData.thumbnails = item.snippet.thumbnails.standard;
  //     responseData.duration = item.contentDetails.duration;
  //     return responseData;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
