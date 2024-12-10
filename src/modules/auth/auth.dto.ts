import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export type AuthToken = {
  access_token?: string;
  refresh_token?: string;
};

export class AuthTokenDto {
  constructor({ access_token, refresh_token }: AuthToken) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
  }

  @IsOptional()
  @IsString()
  readonly access_token: string;

  @IsNotEmpty()
  @IsString()
  readonly refresh_token: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @Length(10, 255)
  readonly code: string;
}
