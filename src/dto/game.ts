import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

import GameSession from "../models/GameSession";
import Song from "../models/Song";
import Playlist from "../models/Playlist";

class UserNicknameAndScore {
    id: number;
    nickname: string;
    order: number;
    score: number;

    constructor(id: number, nickname: string, order:number, score: number) {
        this.id = id;
        this.order = order
        this.nickname = nickname;
        this.score = score;
    }
}

export class GameSettingDto {
    public title: string;
    public game_type: number;
    public goal_score: number;

    constructor(gameSession: GameSession, playlist: Playlist) {
        this.title = playlist.title;
        this.game_type = gameSession.game_type;
        this.goal_score = gameSession.goal_score;
    }
}

export class RoomInfoRequestDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    public room_code: string;

    constructor(room_code: string) {
        this.room_code = room_code;
    }
}

export class RoomInfoResponseDto {
    @IsNotEmpty()
    public gameSetting: GameSettingDto;

    @IsNotEmpty()
    public gameUsers: UserNicknameAndScore[];

    @IsOptional()
    public song: Song | null;

    constructor(gameSetting: GameSettingDto, gameUsers: UserNicknameAndScore[], song: Song | null) {
        this.gameSetting = gameSetting;
        this.gameUsers = gameUsers;
        this.song = song;
    }
}
