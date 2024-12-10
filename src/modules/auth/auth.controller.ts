import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, AuthTokenDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.loginOrSignUp(loginDto);
  }

  @Post('refresh')
  refresh(
    @Body() refreshTokenDto: AuthTokenDto,
    @Headers('authorization') authorization: string,
  ) {
    return this.authService.refreshToken(refreshTokenDto, authorization);
  }
}
