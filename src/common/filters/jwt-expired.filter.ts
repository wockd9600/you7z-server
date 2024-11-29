// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { HttpStatusCode } from 'axios';
// import { Response } from 'express';

// @Catch(UnauthorizedException)
// export class ExpiredTokenFilter implements ExceptionFilter {
//   catch(exception: UnauthorizedException, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();

//     const error = exception.getResponse() as any;
//     console.log('catch');
//     console.log(error.message);
//     if (error?.message === 'jwt expired') {
//       response.status(419).json({
//         statusCode: HttpStatusCode.ImATeapot + 1,
//         message: '토큰 만료',
//       });
//     } else {
//        exception;
//     }
//   }
// }
