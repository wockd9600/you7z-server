import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginService } from './login.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
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
