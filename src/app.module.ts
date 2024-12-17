import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/core/prisma/prisma.module';
import { LoggerModule } from './modules/core/logger/logger.module';
import { LoggingMiddleware } from './common/middlewares/logger.middleware';
import { RedisModule } from './modules/core/redis/redis.module';
import { PlaylistModule } from './modules/playlist/playlist.module';
import { GameModule } from './modules/game/game.module';

// 소켓과 함께 사용하기
// https://velog.io/@hing/NestJS-공식문서-Rate-Limiting
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 1000,
        limit: 1000,
      },
    ]),
    PrismaModule,
    LoggerModule,
    RedisModule,
    UserModule,
    AuthModule,
    PlaylistModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
