import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { Expose } from "class-transformer";

import GameSession from "../models/GameSession";
import Song from "../models/Song";
import Playlist from "../models/Playlist";

export class UserNicknameAndScore {
    userId: number;
    nickname: string;
    order: number;
    score: number;

    constructor(id: number, nickname: string, order: number, score: number) {
        this.userId = id;
        this.order = order;
        this.nickname = nickname;
        this.score = score;
    }
}

export class GameSettingDto {
    public playlist: string;
    public gameType: number;
    public targetScore: number;

    constructor(gameSession: GameSession, playlist: Playlist) {
        this.playlist = playlist.title;
        this.gameType = gameSession.game_type;
        this.targetScore = gameSession.goal_score;
    }
}

class RoomInfo {
    @IsNotEmpty()
    public status: number;

    @IsNotEmpty()
    public roomCode: string;

    @IsNotEmpty()
    public gameSetting: GameSettingDto;

    @IsNotEmpty()
    public users: UserNicknameAndScore[];

    @IsOptional()
    public song: Song | null;

    constructor(status: number, roomCode: string, gameSetting: GameSettingDto, gameUsers: UserNicknameAndScore[], song: Song | null) {
        this.status = status;
        this.roomCode = roomCode;
        this.gameSetting = gameSetting;
        this.users = gameUsers;
        this.song = song;
    }
}

export class RoomInfoRequestDto {
    @Expose()
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    public roomCode: string;

    constructor(roomCode: string) {
        this.roomCode = roomCode;
    }
}

export class RoomInfoResponseDto extends RoomInfo {}
// export class CreateRoomResponseDto extends RoomInfo {}
