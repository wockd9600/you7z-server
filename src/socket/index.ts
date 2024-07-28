import http from "http";
import { Application } from "express";
import { Server } from "socket.io";

export default function initializeSocket(app: Application): http.Server {
    const server = http.createServer(app);
    const io = new Server(server, {
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
        },
        cors: {
            origin: "*", // 실제 환경에서는 특정 origin만 허용하는 것이 좋습니다.
            methods: ["GET", "POST"],
        },
    });

    const ns = io.of("/");
    import("./ns")
        .then((socketHandler) => {
            socketHandler.default(ns);
        })
        .catch((error) => {
            console.error("Failed to load namespace handler:", error);
        });

    return server;
}
