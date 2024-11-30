import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MyLogger } from './modules/core/logger/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appLogger = app.get(MyLogger);
  app.useLogger(appLogger);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
