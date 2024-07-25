import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class LoginRequestDto {
    @IsString()
    @Length(10, 255)
    code: string;

    constructor(code: string) {
        this.code = code;
    }
}

export class LoginReponseDto {
    @IsString()
    access_token: string;
    @IsString()
    refresh_token: string;

    constructor(token: { access_token: string; refresh_token: string }) {
        const { access_token, refresh_token } = token;
        this.access_token = access_token;
        this.refresh_token = refresh_token;
    }
}
