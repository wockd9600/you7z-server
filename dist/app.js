"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
// import RedisStore from "connect-redis"
const socket_1 = __importDefault(require("./socket"));
// import redisClient from "./src/modules/redis-client.js";
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json({ limit: "5mb" }));
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
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});
const ioServer = (0, socket_1.default)(app);
ioServer.listen(8000, () => {
    console.log("서버 시작");
});
