import { LoggerService, Injectable } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class MyLogger implements LoggerService {
  private readonly logger: Logger;
  private context?: string;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: any, context?: string): void {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({
      message,
      trace: trace || 'No Stack Trace Available',
      context: context || this.context,
    });
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, { context: context || this.context });
  }

  getWinstonLogger(): Logger {
    return this.logger;
  }
}
