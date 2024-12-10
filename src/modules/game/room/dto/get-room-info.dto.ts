import { IsNotEmpty, IsOptional } from 'class-validator';
import { GameSettingDto, GameUserDto } from '.';

export class RoomInfoDto {
  @IsNotEmpty()
  public status: number;

  @IsNotEmpty()
  public roomCode: string;

  @IsNotEmpty()
  public managerId: number;

  @IsNotEmpty()
  public gameSetting: GameSettingDto;

  @IsOptional()
  public tempGameSetting: { playlist_id: number; title: string };

  @IsNotEmpty()
  public users: GameUserDto[];

  constructor(
    status: number,
    roomCode: string,
    managerId: number,
    gameSetting: GameSettingDto,
    gameUsers: GameUserDto[],
  ) {
    this.status = status;
    this.roomCode = roomCode;
    this.managerId = managerId;
    this.gameSetting = gameSetting;
    this.tempGameSetting = { playlist_id: -1, title: '' };
    this.users = gameUsers;
  }
}
