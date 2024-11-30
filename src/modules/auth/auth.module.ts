import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { LoginService } from './services/login.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY,
      signOptions: {
        algorithm: 'HS256',
        expiresIn: '15m',
        issuer: 'issuer',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LoginService],
  exports: [JwtModule],
})
export class AuthModule {}
