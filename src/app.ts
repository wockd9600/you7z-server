import "dotenv/config";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import "reflect-metadata";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// import { sequelize } from "./modules/sequelize";
// import RedisStore from "connect-redis"

import { logError } from "./utils/error";
import morganMiddleware from "./middlewares/morgan";

import initializeSocket from "./socket";
// import redisClient from "./src/modules/redis-client.js";

import userRoute from "./routes/user";
import playlistRoute from "./routes/playlist";
import gameRoute from "./routes/game";
import answerRoute from "./routes/answer";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "5mb" }));
app.use(helmet());
app.set("trust proxy", 1);
app.use(morganMiddleware);

// app.get("/health", (req, res) => {
//     // 서버가 정상적으로 작동 중인 경우 200 상태 코드를 반환
//     return res.status(200).send("Healthy");
// });

app.use(
    rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 100,
        handler(req, res) {
            const error = new Error("too many request");
            logError(error, req);

            res.status(429).json({
                code: 429,
                message: "서버 오류",
            });
        },
    })
);

const allowedPaths = ["/user", "/playlist", "/game", "/answer"];

app.use((req, res, next) => {
    const isAllowed = allowedPaths.some((path) => req.path.startsWith(path));
    if (!isAllowed) {
        return res.status(403).send("Forbidden");
    }
    next();
});

// let redisStore = new RedisStore({
//     client: redisClient,
//     prefix: "myapp:",
// });

// app.use(
//     session({
//         store: redisStore,
//         resave: false, // required: force lightweight session keep alive (touch)
//         saveUninitialized: false, // recommended: only save session when data exists
//         secret: process.env.SESSION_SECRET,
//         cookie: { secure: false, sameSite: "none", httpOnly: false },
//     })
// );

// connect db

// connect route

app.use("/user", userRoute);
app.use("/playlist", playlistRoute);
app.use("/game", gameRoute);
app.use("/answer", answerRoute);

app.use((req, res, next) => {
    const error = new Error("404 error");
    logError(error, req);
    return res.status(404).send("Sorry cant find that!");
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    //     const statusCode = error.status;
    //     res.status(statusCode).send(error.message);

    //     const stackLines = error.stack.split("\n");
    //     const truncatedStack = stackLines.slice(0, 5).join("\n");
    //     const reqBodyString = JSON.stringify(req.body);
    //     logger.error(`[${req.method}] ${req.path} | ${statusCode} | [REQUEST] ${reqBodyString} | ${truncatedStack}`);
    logError(error, req);
    return res.status(500).json({ message: error.message });
});

// https://velog.io/@wlduq0150/Artillery-Artillery를-이용해-socket.io-부하테스트-해보기
const ioServer = initializeSocket(app);
ioServer.listen(8000, async () => {
    // test
    // await sequelize
    //     .authenticate()
    //     .then(async () => {
    //         console.log("connection success");
    //     })
    //     .catch((e) => {
    //         console.log("TT : ", e);
    //     });
    // console.log("서버 시작");
});
