import { Global, Module } from '@nestjs/common';
import { MyLogger } from './logger.service';
import { logger } from './winston.logger';

@Global()
@Module({
  providers: [
    {
      provide: MyLogger,
      useValue: new MyLogger(logger),
    },
  ],
  exports: [MyLogger],
})
export class LoggerModule {}
