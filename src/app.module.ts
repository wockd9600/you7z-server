import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/core/prisma/prisma.module';
import { LoggerModule } from './modules/core/logger/logger.module';
import { LoggingMiddleware } from './common/middlewares/logger.middleware';

@Module({
  imports: [PrismaModule, UserModule, AuthModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // 모든 경로에 대해 미들웨어 적용
  }
}
