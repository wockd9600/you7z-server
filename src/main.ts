import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MyLogger } from './modules/core/logger/logger.service';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // app.enableCors({
  //   origin: ['https://example.com', 'https://api.example.com'], // 허용 도메인
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true, // 쿠키 전달 허용
  // });

  app.set('trust proxy', 'loopback');
  app.use(helmet());

  const appLogger = app.get(MyLogger);
  app.useLogger(appLogger);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(
    new ThrottlerExceptionFilter(),
    new GlobalExceptionFilter(),
  );
  return app;
}

async function bootstrap() {
  const app = await createApp();
  // app.useWebSocketAdapter(new JwtSocketAdapter(app));
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
