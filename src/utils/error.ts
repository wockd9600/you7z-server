import { Request } from "express";
import logger from "../config/logger";

export default function logError(error: Error, req: Request) {
    // Structured logging to capture useful information
    logger.error({
        message: error.message,
        method: req.method,
        url: req.originalUrl,
        stack: error.stack,
        requestBody: req.body,
        clientIp: req.ip,
    });
}