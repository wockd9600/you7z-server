import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/core/prisma/prisma.service';
import { GameContextDto } from '../dto';
import {
  GAME_PLAYER_STATUS,
  GAME_ROOM_STATUS,
  GAME_SESSION_STATUS,
} from 'src/common/constants/game.constant';
import { GameService } from '../game.service';
import { GameRoomRuleService } from './room-rule.service';
import { GameSettingDto, GameUserDto, RoomInfoDto } from './dto';
import { GameSongDto } from '../dto/song.dto';
import { InvalidRoomException } from 'src/common/exception/room.exception';

@Injectable()
export class GameRoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameService: GameService,
    private readonly gameRuleService: GameRoomRuleService,
  ) {}

  async getRoomInfo(context: GameContextDto) {
    const { roomCode, gameSession } = context;

    // 공통 로직 처리
    const gameSettingDto = await this.getGameSetting(gameSession);
    const users = await this.getRoomUsers(gameSession.sessionId);

    if (users.length === 0)
      throw new InvalidRoomException('No users found in the room.');

    // --- 시작한 방일 때 ---
    if (gameSession.status === GAME_SESSION_STATUS.IN_PROGRESS) {
      return this.getInProgressRoomInfo(
        roomCode,
        gameSession,
        gameSettingDto,
        users,
      );
    }

    return this.getPreGameRoomInfo(
      roomCode,
      gameSession,
      gameSettingDto,
      users,
    );
  }

  async joinRoom(userId: number, roomCode: string) {
    return this.prisma.$transaction(async (prisma: PrismaService) => {
      const { gameSession } =
        await this.gameService.getGameSessionFromRoomCode(roomCode);
      const sessionId = gameSession.sessionId;

      // 이미 입장한 유저인지 확인
      await this.gameService.ensureUserNotInRoom(userId, sessionId);

      // 입장 중인 방이 있으면 나감 처리. (오류 방지)
      await this.gameService.leaveAllRooms(userId);

      // 방에 입장 가능한지 유효성 확인
      await this.gameRuleService.canJoinRoom(gameSession);

      // 방에 새로 입장
      await this.addGamePlayer(userId, gameSession.sessionId, prisma);

      return { status: HttpStatus.OK, message: '입장 완료' };
    });
  }

  async createRoom(userId: number) {
    return await this.prisma.$transaction(async (prisma: PrismaService) => {
      // 입장 중인 방이 있으면 나감 처리. (오류 방지)
      await this.gameService.leaveAllRooms(userId);

      // create room 생성
      const roomCode = await this.createUniqueRoomCode(prisma);
      const gameRoom = await prisma.gameRoom.create({ data: { roomCode } });

      const playlistId = await this.getPlaylistId(userId, prisma);

      // create session 생성
      const gameSession = await prisma.gameSession.create({
        data: {
          room_id: gameRoom.room_id,
          userId,
          playlistId,
        },
      });

      // 인원수 추가
      await this.addGamePlayer(userId, gameSession.sessionId, prisma);
      return { status: HttpStatus.OK, roomCode };
    });
  }

  async addGamePlayer(
    userId: number,
    sessionId: number,
    prisma?: PrismaService,
  ) {
    const prismaObject = prisma ? prisma : this.prisma;
    await prismaObject.gamePlayer.create({
      data: {
        userId,
        sessionId,
      },
    });
  }

  async getPlaylistId(userId: number, prisma: PrismaService) {
    // 기본 플레이리스트 설정
    let playlistId = 1;
    const previousGameSession = await prisma.gameSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (previousGameSession) {
      playlistId = previousGameSession.playlistId;
    } else {
      const popularPlaylist = await prisma.playlist.findFirst({
        orderBy: { download_count: 'desc' },
        select: { playlistId: true },
      });

      if (!popularPlaylist) {
        new InvalidRoomException(
          `No popular playlists found, using default playlist ID: ${playlistId}`,
        );
      }

      playlistId = popularPlaylist.playlistId;
    }
    return playlistId;
  }

  private async getGameSetting(gameSession: any): Promise<GameSettingDto> {
    const playlist = await this.prisma.playlist.findFirst({
      where: { playlistId: gameSession.playlistId },
    });

    if (!playlist) {
      throw new InvalidRoomException(
        `Playlist ${gameSession.playlistId} of game setting not found`,
      );
    }

    return new GameSettingDto(gameSession, playlist);
  }

  private async getInProgressRoomInfo(
    roomCode: string,
    gameSession: any,
    gameSettingDto: GameSettingDto,
    users: any[],
  ) {
    const currentSongId = await getCurrentSongId();
    const currentSong = await this.prisma.song.findFirst({
      where: { songId: currentSongId },
    });
    const gameSongDto = new GameSongDto(currentSong);

    const gameUserDtos = await this.transformUsers(
      gameSession.sessionId,
      users,
    );

    return {
      status: HttpStatus.OK,
      roomData: new RoomInfoDto(
        gameSession.status,
        roomCode,
        gameSession.userId,
        gameSettingDto,
        gameUserDtos,
      ),
      gameSongDto,
    };
  }

  private async getPreGameRoomInfo(
    roomCode: string,
    gameSession: any,
    gameSettingDto: GameSettingDto,
    users: any[],
  ) {
    const gameUserDtos = this.mapUsers(users);

    return {
      status: HttpStatus.OK,
      roomData: new RoomInfoDto(
        gameSession.status,
        roomCode,
        gameSession.userId,
        gameSettingDto,
        gameUserDtos,
      ),
    };
  }

  private async transformUsers(
    sessionId: number,
    users: any[],
  ): Promise<GameUserDto[]> {
    const scores = await this.getUsersScore(sessionId, users); // [{ userId: 1, score: 100 }, ...]
    const readys = await this.getUsersReady(sessionId, users); // [{ userId: 1, ready: true }, ...]

    const scoreDict: { [key: number]: string } = scores.reduce(
      (acc, item) => {
        acc[item.userId] = item.score;
        return acc;
      },
      {} as { [key: number]: string },
    );

    const readyDict: { [key: number]: number } = readys.reduce(
      (acc, item) => {
        acc[`${item.userId}`] = item.order;
        return acc;
      },
      {} as { [key: number]: number },
    );

    return this.mapUsers(users, scoreDict, readyDict);
  }

  private mapUsers(users: any[], scoreDict?: any, readyDict?: any) {
    return users.map(
      (item, index) =>
        new GameUserDto({
          userId: item.userId,
          nickname: item.user?.user_profile?.nickname || '',
          order: index,
          score: scoreDict ? 0 : scoreDict[item.userId],
          ready: readyDict ? true : readyDict[item.userId],
        }),
    );
  }

  private async getRoomUsers(sessionId: number) {
    return await this.prisma.gamePlayer.findMany({
      where: {
        sessionId,
        status: GAME_PLAYER_STATUS.NOMAL,
      },
      orderBy: { player_id: 'asc' },
      select: {
        playerId: true,
        userId: true,
        status: true,
        user: {
          select: {
            user_profile: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    });
  }

  async createUniqueRoomCode(prisma: PrismaService) {
    let isUnique = false;
    let roomCode = '';

    while (!isUnique) {
      roomCode = '';

      const length = 6;
      const characters = '0123456789';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        roomCode += characters.charAt(randomIndex);
      }
    }

    const existingRoom = await prisma.gameRoom.findFirst({
      where: { roomCode, status: GAME_ROOM_STATUS.NOMAL },
    });

    if (!existingRoom) {
      isUnique = true;
    }

    return roomCode;
  }
}
