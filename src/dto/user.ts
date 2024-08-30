import { IsEmail, IsNumber, IsOptional, IsNotEmpty, IsString, Length } from "class-validator";
import { Expose } from "class-transformer";

type AuthToken = {
    access_token?: string;
    refresh_token?: string;
};

export class AuthTokenDto {
    @Expose()
    @IsOptional()
    @IsString()
    access_token: string;

    @Expose()
    @IsOptional()
    @IsString()
    refresh_token: string;

    // constructor({ access_token, refresh_token }: AuthToken) {
    //     this.access_token = access_token ?? "";
    //     this.refresh_token = refresh_token ?? "";
    // }
}

export class LoginRequestDto {
    @Expose()
    @IsNotEmpty()
    @IsString()
    @Length(10, 255)
    public code: string;

    // constructor({ code }: { code: string }) {
    //     this.code = code;
    // }
}

export class LoginResponseDto extends AuthTokenDto {
    @Expose()
    @IsNotEmpty()
    @IsString()
    nickname: string;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    userId: number;
}

export class RefreshRequestDto extends AuthTokenDto {}
export class RefreshResponsetDto extends AuthTokenDto {}

export class UpdateNameDto {
    @Expose()
    @IsNotEmpty()
    @IsString()
    @Length(1, 20)
    nickname: string;
}
