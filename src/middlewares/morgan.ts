import morgan from "morgan";
import logger from "../config/logger";

export default morgan("combined", {
    stream: {
        write: (message) => {
            logger.info(message.trim());
        },
    },
});

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
