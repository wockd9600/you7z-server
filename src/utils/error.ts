import { Request } from "express";
import logger from "../config/logger";
import { Socket } from "socket.io";

export function logError(error: Error, req: Request) {
    // Structured logging to capture useful information
    // console.log("log error ", error);
    logger.error({
        message: `${error.message}`,
        method: req.method,
        user_id: req.user?.user_id || -1,
        url: req.originalUrl,
        stack: error.stack,
        clientIp: req.ip,
    });
}

export function logErrorSocket(error: Error, socket: Socket, params: any) {
    // Structured logging to capture useful information
    const clientIp = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
    const url = params?.event || "not url";
    // console.log(error);
    logger.error({
        message: error.message,
        method: "",
        user_id: socket.data.userId || -1,
        url,
        stack: error.stack,
        clientIp,
    });
}
