import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { MyLogger } from 'src/modules/core/logger/logger.service';
import { logger } from 'src/modules/core/logger/winston.logger';

// @Catch(ServiceException)
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new MyLogger(logger);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const { method, originalUrl, ip, user } = request;
    const userAgent = request.headers['user-agent'] || '';
    const userId = user && user.user_id ? user.user_id : -1;

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const errorMessage =
      exception instanceof Error ? exception : '알 수 없는 오류';
    const errorStack =
      exception instanceof Error ? JSON.stringify(exception.stack) : '';

    this.logger.error(
      `[${method}] ${originalUrl} (${userId}) ${userAgent} - ${ip} - ${statusCode}`,
      errorStack,
      'GlobalExceptionFilter',
    );

    response.status(statusCode).json({
      status: statusCode,
      message: errorMessage,
    });
  }
}
