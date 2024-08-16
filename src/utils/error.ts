import { Request } from "express";
import logger from "../config/logger";

export default function logError(error: Error, req: Request) {
    // Structured logging to capture useful information
    console.log(error);
    logger.error({
        message: error.message,
        method: req.method,
        user_id: req.user?.user_id || -1,
        url: req.originalUrl,
        stack: error.stack,
        clientIp: req.ip,
    });
}
