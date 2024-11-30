// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import { MyLogger } from 'src/modules/core/logger/logger.service';

// @Injectable()
// export class LoggingMiddleware implements NestMiddleware {
//   constructor(private readonly logger: MyLogger) {}

//   use(req: Request, res: Response, next: NextFunction): void {
//     const { method, url, ip } = req;
//     const userAgent = req.headers['user-agent'] || '';

//     // 응답이 끝난 후 로그 기록
//     res.on('finish', () => {
//       const { statusCode } = res;
//       const logMessage = `${method} ${url} ${statusCode} - ${userAgent} - ${ip}`;

//       if (statusCode >= 500) {
//         this.logger.error(logMessage, '', 'HTTP');
//       } else if (statusCode >= 400) {
//         this.logger.warn(logMessage, 'HTTP');
//       } else {
//         this.logger.log(logMessage, 'HTTP');
//       }
//     });

//     next(); // 다음 미들웨어 또는 핸들러로 이동
//   }
// }

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MyLogger } from 'src/modules/core/logger/logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: MyLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.headers['user-agent'] || '';
    const user = req.user;
    console.log(user);

    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      if (statusCode > 399) return;

      this.logger.log(
        `[${method}] ${originalUrl} ${userAgent} - ${ip} - ${statusCode} ${res.statusMessage} (${duration}ms)`,
        'HTTP',
      );
    });

    next();
  }
}
