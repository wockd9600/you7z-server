import "dotenv/config";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";

// import { sequelize } from "./modules/sequelize";
// import RedisStore from "connect-redis"

import logger from "./config/logger";

import morganMiddleware from "./middlewares/morgan";

import initializeSocket from "./socket";
// import redisClient from "./src/modules/redis-client.js";

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
// app.use("/todos", todoRoutes);

app.get("/error", (req, res, next) => {
    const err = new Error("Something went wrong!");
    next(err);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    //     const statusCode = error.status;
    //     res.status(statusCode).send(error.message);

    //     const stackLines = error.stack.split("\n");
    //     const truncatedStack = stackLines.slice(0, 5).join("\n");
    //     const reqBodyString = JSON.stringify(req.body);
    //     logger.error(`[${req.method}] ${req.path} | ${statusCode} | [REQUEST] ${reqBodyString} | ${truncatedStack}`);
    logger.error(`${500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(500).json({ message: err.message });
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
