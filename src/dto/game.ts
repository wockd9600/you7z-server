import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { Expose } from "class-transformer";

import GameSession from "../models/GameSession";
import Song from "../models/Song";
import Playlist from "../models/Playlist";
import Answer from "../models/Answer";

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
    // public gameType: number;
    public targetScore: number;

    constructor(gameSession: GameSession, playlist: Playlist) {
        this.playlist = playlist.title;
        // this.gameType = gameSession.game_type;
        this.targetScore = gameSession.goal_score;
    }
}

export class GameAnswerDto {
    id?: number;
    userId?: number;
    message?: string;
    isAlert?: number;
    constructor({ answer_id, user_id, content, is_alert }: Partial<Answer>) {
        this.id = answer_id;
        this.userId = user_id;
        this.message = content;
        this.isAlert = is_alert;
    }
}

class RoomInfo {
    @IsNotEmpty()
    public status: number;

    @IsNotEmpty()
    public roomCode: string;

    @IsNotEmpty()
    public managerId: number;

    @IsNotEmpty()
    public gameSetting: GameSettingDto;

    @IsNotEmpty()
    public users: UserNicknameAndScore[];

    @IsOptional()
    public answers: GameAnswerDto[];

    @IsOptional()
    public song: Song | null;

    constructor(status: number, roomCode: string, managerId: number, gameSetting: GameSettingDto, gameUsers: UserNicknameAndScore[], answers: GameAnswerDto[], song: Song | null) {
        this.status = status;
        this.roomCode = roomCode;
        this.managerId = managerId;
        this.gameSetting = gameSetting;
        this.users = gameUsers;
        this.answers = answers;
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
