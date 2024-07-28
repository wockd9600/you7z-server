import { IsEmail, IsNumber, IsOptional, IsNotEmpty, IsString, Length } from "class-validator";

type AuthToken = {
    access_token?: string;
    refresh_token?: string;
};

export class AuthTokenDto {
    @IsOptional()
    @IsString()
    access_token: string;

    @IsOptional()
    @IsString()
    refresh_token: string;

    constructor({ access_token, refresh_token }: AuthToken) {
        this.access_token = access_token ?? "";
        this.refresh_token = refresh_token ?? "";
    }
}

export class LoginRequestDto {
    @IsNotEmpty()
    @IsString()
    @Length(10, 255)
    code: string;

    constructor({ code }: { code: string }) {
        this.code = code;
    }
}

export class LoginResponseDto extends AuthTokenDto {}

export class RefreshRequestDto extends AuthTokenDto {}
export class RefreshResponsetDto extends AuthTokenDto {}

export class UpdateNameDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 20)
    nickname: string;

    constructor({ nickname }: { nickname: string }) {
        this.nickname = nickname;
    }
}
