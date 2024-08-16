import { Request } from "express";

import morgan from "morgan";
import jwt from "../modules/jwt";
import logger from "../config/logger";

import { JwtPayload } from "jsonwebtoken";

morgan.token("user-id", (req) => {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
    let user: JwtPayload | string | null = null;
    let user_id = -1;

    if (token) {
        user = jwt.decode(token); // Decode the token without verification

        if (user && typeof user !== "string" && "id" in user) {
            user_id = user.id as number; // Cast to number if you know the type
        }
    }

    return user_id.toString();
});

morgan.token("device", (req) => {
    const userAgent = req.headers["x-custom-user-agent"];
    if (typeof userAgent === "string") {
        const deviceInfo = userAgent.match(/\(([^)]+)\)/);
        return deviceInfo ? deviceInfo[1] : "unknown";
    }
    return "unknown";
});

morgan.token("ip", (req: Request) => req.ip);

const customMorganFormat = ':ip - (:user-id) ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms :device';

// Use Morgan with the custom format
export default morgan(customMorganFormat, {
    stream: {
        write: (message) => {
            logger.info(message.trim());
        },
    },
});

// export default morgan(':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms', {
//     stream: {
//         write: (message) => {
//             logger.info(message.trim());
//         },
//     },
// });

// const morganMiddleware = morgan((tokens, req, res) => {
// 	// `${info.timestamp} ${info.level}: ${info.message}`;

//     const logMessage = `[${tokens.method(req, res)}] ${tokens.url(req, res)} | ${tokens.status(req, res)}
// 	 | ${tokens.res(req, res, "content-length")} - ${tokens["response-time"](req, res)} ms |
// 	[Response] ${JSON.stringify(req.body!)}`;

//     const statusCode = res.statusCode;
//     if (statusCode < 400) {
//         logger.info(logMessage);
//     }
//     return null;
// });

// export default morganMiddleware;
