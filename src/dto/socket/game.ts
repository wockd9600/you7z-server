import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from "class-validator";
import { Expose } from "class-transformer";

export class UserKickRequestDto {
    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: "kickedUserId must be a non-negative number." })
    public kickedUserId: number;
}

export class ChangeGameSettingRequestDto {
    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: "playlistId must be a non-negative number." })
    public playlistId: number;

    // @Expose()
    // @IsNotEmpty()
    // @IsNumber()
    // @IsIn([0, 1], { message: "gameType must be either 0 or 1." })
    // public gameType: number;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @IsIn([5, 10, 15, 20], { message: "targetScore must be one of 5, 10, 15, 20." })
    public targetScore: number;
}

export class ChangeUserNameRequestDto {
    @Expose()
    @IsNotEmpty()
    @IsString()
    @Length(0, 10)
    public name: string;
}
// export class CreateRoomResponseDto extends RoomInfo {}

