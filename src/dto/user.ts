import { IsEmail, IsNumber, IsOptional, IsString, Length } from "class-validator";

type AuthToken = {
    access_token: string;
    refresh_token: string;
};

export class AuthTokenDto {
    @IsString()
    access_token: string;

    @IsString()
    refresh_token: string;

    constructor({ access_token, refresh_token }: AuthToken) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
    }
}

export class LoginRequestDto {
    @IsString()
    @Length(10, 255)
    code: string;

    constructor(code: string) {
        this.code = code;
    }
}

export class LoginResponseDto extends AuthTokenDto {}

export class RefreshRequestDto extends AuthTokenDto {}
export class RefreshResponsetDto extends AuthTokenDto {}

export class UserProfileDto {
    @IsNumber()
    user_id: number;

    @IsString()
    @Length(1, 20)
    nickname: string;

    constructor(user_id: number, nickname: string) {
        this.user_id = user_id;
        this.nickname = nickname;
    }
}
