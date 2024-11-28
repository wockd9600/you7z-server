import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { LoginService } from './services/login.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
  providers: [AuthService, JwtStrategy, LoginService],
  exports: [JwtModule],
})
export class AuthModule {}
