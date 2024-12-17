import { IsIn, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class UserKickRequestDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive({ message: 'kickedUserId must be a positive number.' })
  public kickedUserId: number;
}

export class UpdateGameSettingRequestDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive({ message: 'playlistId must be a non-negative number.' })
  public playlistId: number;

  // @Expose()
  // @IsNotEmpty()
  // @IsNumber()
  // @IsIn([0, 1], { message: "gameType must be either 0 or 1." })
  // public gameType: number;

  @IsNotEmpty()
  @IsNumber()
  @IsIn([5, 10, 15, 20, 255], {
    message: 'targetScore must be one of 5, 10, 15, 20, 255.',
  })
  public targetScore: number;
}
