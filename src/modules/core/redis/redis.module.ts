import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT', // 의존성 토큰
      useFactory: () => {
        return new Redis({
          host: 'localhost',
          port: 6379,
          // password: 'your_password',
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
