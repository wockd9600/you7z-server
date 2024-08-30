import "dotenv/config";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import "reflect-metadata";

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

app.use(morganMiddleware);

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

app.use("/", (req, res, next) => {
    const err = new Error("404 Not Found");
    next(err);
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    //     const statusCode = error.status;
    //     res.status(statusCode).send(error.message);

    //     const stackLines = error.stack.split("\n");
    //     const truncatedStack = stackLines.slice(0, 5).join("\n");
    //     const reqBodyString = JSON.stringify(req.body);
    //     logger.error(`[${req.method}] ${req.path} | ${statusCode} | [REQUEST] ${reqBodyString} | ${truncatedStack}`);
    logError(error, req);
    res.status(500).json({ message: error.message });
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
