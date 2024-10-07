import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { Expose } from "class-transformer";

import GameSession from "../models/GameSession";
import Playlist from "../models/Playlist";
import Answer from "../models/Answer";

export class GameUserDto {
    userId: number;
    nickname: string;
    order: number;
    score: number;
    isReady: boolean;

    constructor(data: { userId: number; nickname: string; order: number; score: number }) {
        const { userId, nickname, order, score } = data;

        this.userId = userId;
        this.order = order;
        this.nickname = nickname;
        this.score = score;
        this.isReady = true;
    }
}

export class GameSongDto {
    id: number;
    url: string;
    startTime: string;
    // description: string;

    constructor(data: { song_id: number; url: string; start_time: string; description: string }) {
        const { song_id, url, start_time, description } = data;
        this.id = song_id;
        this.url = url;
        this.startTime = start_time;
        // this.description = description;
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

export class GamePlaylistDto {
    title: string;
    description: string;

    constructor(data: { title: string; description: string }) {
        const { title, description } = data;
        this.title = title;
        this.description = description;
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
    public users: GameUserDto[];

    @IsOptional()
    public answers: GameAnswerDto[];

    constructor(status: number, roomCode: string, managerId: number, gameSetting: GameSettingDto, gameUsers: GameUserDto[], answers: GameAnswerDto[]) {
        this.status = status;
        this.roomCode = roomCode;
        this.managerId = managerId;
        this.gameSetting = gameSetting;
        this.users = gameUsers;
        this.answers = answers;
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
