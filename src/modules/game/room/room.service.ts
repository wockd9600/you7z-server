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
import { InvalidRoomException } from 'src/common/exception/game.exception';
import { Server, Socket } from 'socket.io';
import { UserService } from 'src/modules/user/user.service';
import { GameAnswerDto } from '../dto/answer.dto';
import { PlaylistService } from 'src/modules/playlist/playlist.service';

@Injectable()
export class GameRoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly playlistService: PlaylistService,
    private readonly gameService: GameService,
    private readonly gameRuleService: GameRoomRuleService,
  ) {}

  async getRoomInfo(context: GameContextDto) {
    const { roomCode, gameSession } = context;

    // 공통 로직 처리
    const gameSettingDto = await this.getGameSetting(gameSession);
    const users = await this.getGamePlayers(gameSession.sessionId);

    if (users.length === 0)
      throw new InvalidRoomException('No users found in the room.');

    // --- 시작한 방일 때 ---
    if (gameSession.status === GAME_SESSION_STATUS.STARTED) {
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

  // ws
  async wsJoinRoom(io: Server, socket: Socket) {
    const { userId, roomCode, gameSession } = socket.data;
    const sessionId = gameSession.sessionId;

    // 유저가 방에 있는지 확인
    await this.gameService.ensureUserInRoom(userId, sessionId);

    const user = this.getGamePlayer(sessionId, userId);
    const gameUserDtos = await this.transformUsers(sessionId, [user])[0];

    io.to(roomCode).emit('join user', gameUserDtos);
  }

  async wsKickUser(io: Server, socket: Socket, params: any) {
    // user id와 kick할 user id를 가져와서
    const { userId, roomCode, gameSession } = socket.data;
    const { kickedUserId } = params.data;
    const sessionId = gameSession.sessionId;

    // 시작한 방인지 확인
    this.gameRuleService.ensureGameNotStarted(sessionId, gameSession.status);
    // 방장인지 확인
    this.gameRuleService.ensureUserIsRoomManager(userId, gameSession.userId);
    // 자신은 강퇴할 수 없음
    if (userId === kickedUserId) throw new Error("can't kick myself");

    // 유저가 있는지 확인
    await this.gameService.ensureUserInRoom(kickedUserId, sessionId);

    // 유저 나감 처리
    await this.leaveGamePlayer(kickedUserId, sessionId);

    // 메시지로 알림
    const user = await this.userService.findUserProfileByUserId(kickedUserId);
    const alertData = new GameAnswerDto({
      answerId: 0,
      userId: kickedUserId,
      content: `${user.nickname}님이 강퇴당했습니다.`,
      isAlert: true,
    });

    // 방의 유저들에게 알려줌. 해당 유저는 방에서 강퇴 emit
    io.to(roomCode).emit('user kick', alertData);
  }

  async wsUpdateRoomSettings(io: Server, socket: Socket, params: any) {
    // user id와 game code, 변경할 key, value를 받는다.
    const { userId, roomCode, gameSession } = socket.data;
    const { playlistId, targetScore } = params.data;
    const sessionId = gameSession.sessionId;

    // 시작한 방인지 확인
    this.gameRuleService.ensureGameNotStarted(sessionId, gameSession.status);
    // 방장인지 확인
    this.gameRuleService.ensureUserIsRoomManager(userId, gameSession.userId);

    const playlist =
      await this.playlistService.findPlaylistByPlaylistId(playlistId);

    // 게임방 설정 변경
    const gameRoomData = { sessionId };
    if (playlistId) gameRoomData['playlist_id'] = playlistId;
    // if (gameType) gameRoomData.game_type = gameType;
    if (targetScore) gameRoomData['goal_score'] = targetScore;

    await this.gameService.updateGameSession(gameRoomData);

    const answer = new GameAnswerDto({
      answerId: 0,
      userId,
      content: '방 정보가 변경되었습니다.',
      isAlert: true,
    });

    // 변경할 설정을 적용한다.
    // 방에 있는 사람들에게 전달 emit
    const responseData = {
      playlist_id: playlistId,
      title: playlist.title,
      targetScore,
      answer,
    };
    io.to(roomCode).emit('change game setting', responseData);
  }

  async wsUpdateUserName(io: Server, socket: Socket) {
    const { userId, roomCode, gameSession } = socket.data;
    const { sessionId } = gameSession;

    this.gameRuleService.ensureGameNotStarted(sessionId, gameSession.status);
    const userProfile = await this.userService.findUserProfileByUserId(userId);

    // 방에 있는 사람들에게 user name을 보낸다.
    const responseData = { userId, sanitizedName: userProfile.nickname };
    io.to(roomCode).emit('change user name', responseData);
  }

  // UserTimer
  async wsUpdateUserStatus(io: Server, socket: Socket) {
    const { userId, roomCode, gameSession } = socket.data;
    const sessionId = gameSession.sessionId;

    this.gameService.ensureUserInRoom(userId, sessionId);

    UserTimer.clearTimer(userId);
    await this.reconnectGamePlayer(userId, sessionId);

    const responseData = { userId, status: GAME_PLAYER_STATUS.NOMAL };
    io.to(roomCode).emit('change user status', responseData);
  }

  async wsLeaveRoom(io: Server, socket: Socket) {
    const { userId, roomCode, gameRoom, gameSession } = socket.data;
    const sessionId = gameSession.sessionId;

    this.gameRuleService.ensureGameNotStarted(sessionId, gameSession.status);
    await this.gameService.ensureUserInRoom(userId, sessionId);

    // 현재 유저들 가져옴
    const users = await this.getGamePlayers(sessionId);

    let nextManagerId: number;
    await this.prisma.$transaction(async (prisma: PrismaService) => {
      await this.leaveGamePlayer(userId, sessionId, prisma);

      // 1명이면 방을 삭제함
      if (users.length === 1) {
        await Promise.all([
          this.gameService.updateGameRoom(
            {
              roomId: gameRoom.roomId,
              status: GAME_ROOM_STATUS.DELETED,
            },
            prisma,
          ),
          this.gameService.updateGameSession(
            {
              sessionId,
              status: GAME_SESSION_STATUS.FINISHED,
            },
            prisma,
          ),
        ]);
        return;
      }

      // 방장이면 다음 순서를 방장으로 바꿈
      if (gameSession.user_id === userId) {
        nextManagerId = users[0].userId;

        await this.gameService.updateGameSession(
          {
            sessionId: gameSession.session_id,
            userId: nextManagerId,
          },
          prisma,
        );
      }
    });

    const userProfile = await this.userService.findUserProfileByUserId(userId);
    const answer = new GameAnswerDto({
      answerId: 0,
      userId: userId,
      content: `${userProfile.nickname}님이 나갔습니다.`,
      isAlert: true,
    });

    const responseData = { leaveUserId: userId, answer, nextManagerId };
    io.to(roomCode).emit('leave game', responseData);
  }

  /* getRoomInfo */
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

  private async getGamePlayer(sessionId: number, userId: number) {
    return await this.prisma.gamePlayer.findFirst({
      where: {
        sessionId,
        status: GAME_PLAYER_STATUS.NOMAL,
        userId,
      },
      orderBy: { playerId: 'desc' },
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

  private async getGamePlayers(sessionId: number) {
    return await this.prisma.gamePlayer.findMany({
      where: {
        sessionId,
        status: GAME_PLAYER_STATUS.NOMAL,
      },
      orderBy: { playerId: 'asc' },
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

  private async getInProgressRoomInfo(
    roomCode: string,
    gameSession: any,
    gameSettingDto: GameSettingDto,
    users: any[],
  ) {
    const { sessionId, userId, status } = gameSession;

    const currentSongId = await this.gameService.getCurrentSongId(sessionId);
    const currentSong = await this.prisma.song.findFirst({
      where: { songId: currentSongId },
    });
    const gameSongDto = new GameSongDto(currentSong);

    const gameUserDtos = await this.transformUsers(sessionId, users);

    return {
      status: HttpStatus.OK,
      roomData: new RoomInfoDto(
        status,
        roomCode,
        userId,
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
    const scores = await this.gameService.getPlayersScore(users, sessionId); // [{ userId: 1, score: 100 }, ...]
    const readys = await this.gameService.getPlayersReady(users, sessionId); // [{ userId: 1, ready: true }, ...]

    const scoreDict: { [key: number]: string } = scores.reduce(
      (acc, item) => {
        acc[`${item.userId}`] = item.score;
        return acc;
      },
      {} as { [key: number]: string },
    );

    const readyDict: { [key: number]: number } = readys.reduce(
      (acc, item) => {
        acc[`${item.userId}`] = item.isReady;
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
          isReady: readyDict ? true : readyDict[item.userId],
        }),
    );
  }

  /* createRoom */
  private async createUniqueRoomCode(prisma: PrismaService) {
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

  private async getPlaylistId(userId: number, prisma: PrismaService) {
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

  private async addGamePlayer(
    userId: number,
    sessionId: number,
    prisma?: PrismaService,
  ) {
    const activePrisma = prisma ? prisma : this.prisma;
    await activePrisma.gamePlayer.create({
      data: {
        userId,
        sessionId,
      },
    });
  }

  private async existingPlayer(
    userId: number,
    sessionId: number,
    prisma: PrismaService,
  ) {
    return await prisma.gamePlayer.findFirst({
      where: {
        sessionId,
        userId,
        NOT: {
          status: GAME_PLAYER_STATUS.LEAVE,
        },
      },
      select: { playerId: true },
      orderBy: { playerId: 'desc' },
    });
  }

  private async leaveGamePlayer(
    userId: number,
    sessionId: number,
    prisma?: PrismaService,
  ) {
    const activePrisma = prisma ? prisma : this.prisma;
    const existingPlayer = await this.existingPlayer(
      userId,
      sessionId,
      activePrisma,
    );

    if (existingPlayer) {
      await activePrisma.gamePlayer.update({
        where: { playerId: existingPlayer.playerId },
        data: {
          status: GAME_PLAYER_STATUS.LEAVE,
        },
      });
    }
  }

  private async reconnectGamePlayer(
    userId: number,
    sessionId: number,
    prisma?: PrismaService,
  ) {
    const activePrisma = prisma ? prisma : this.prisma;
    const existingPlayer = await this.existingPlayer(
      userId,
      sessionId,
      activePrisma,
    );

    if (existingPlayer) {
      await activePrisma.gamePlayer.update({
        where: { playerId: existingPlayer.playerId },
        data: {
          status: GAME_PLAYER_STATUS.NOMAL,
        },
      });
    }
  }
}
