// import { IoAdapter } from '@nestjs/platform-socket.io';
// import { WebSocketJwtMiddleware } from './middlewares/websocket-jwt.middleware';

// export class JwtSocketAdapter extends IoAdapter {
//   createIOServer(port: number, options?: any): any {
//     const server = super.createIOServer(port, options);

//     server.use((socket, next) => {
//       const middleware =
//         new WebSocketJwtMiddleware(/* Inject dependencies here */);
//       middleware.use(socket, next);
//     });

//     return server;
//   }
// }
