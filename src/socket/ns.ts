import jwt from "../modules/jwt";

import { Socket, Namespace } from "socket.io";

import { validateOrReject, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";

import GameRepository from "../repositories/implementations/game";
import AnswerRepository from "../repositories/implementations/answer";
import PlaylistRepository from "../repositories/implementations/playlist";
import UserRepository from "../repositories/implementations/user";

import GameController from "../controllers/socket/game";
import AnswerController from "../controllers/socket/answer";

import logger from "../config/logger";
import { logErrorSocket } from "../utils/error";
import { UserKickRequestDto, ChangeGameSettingRequestDto, ChangeUserNameRequestDto } from "../dto/socket/game";

const gameRepository = new GameRepository();
const playlistRepository = new PlaylistRepository();
const userRepository = new UserRepository();
const answerRepository = new AnswerRepository();

const gameController = new GameController(gameRepository, playlistRepository, userRepository, answerRepository);
const answerController = new AnswerController(answerRepository, gameRepository);

class CustomValidationError extends Error {
    validationErrors: ValidationError[];

    constructor(validationErrors: ValidationError[]) {
        const message = validationErrors.map((e) => `Property ${e.property}: ${Object.values(e.constraints || {}).join(", ")}`).join("; ");

        super(message);
        this.name = "CustomValidationError";
        this.validationErrors = validationErrors;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomValidationError);
        }
    }
}

export default function initializeNamespace(io: Namespace) {
    async function validateParams(schema: any, params: any): Promise<any> {
        try {
            const { data } = params;
            const target = plainToClass(schema, data, { excludeExtraneousValues: true });
            await validateOrReject(target);
            return target;
        } catch (error) {
            if (Array.isArray(error) && error.every((e) => e instanceof ValidationError)) {
                throw new CustomValidationError(error);
            } else {
                throw error;
            }
        }
    }

    async function eventMiddleware(params: any, socket: Socket, next: Function, schema?: any | undefined) {
        try {
            // console.log(params);
            // logger.info(`socket on ${params}`);

            if (schema) await validateParams(schema, params);

            const { token } = params;
            if (!token) throw new Error("로그인 정보가 없습니다.");

            const decoded = await jwt.verify(token);
            if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
                socket.data.userId = decoded.id;
                return next();
            } else {
                throw new Error("don't exist user_id");
            }

            // *수정 log
        } catch (error) {
            if (error instanceof CustomValidationError) {
                logErrorSocket(error, socket, params);
                socket.emit("validation error", error);
            } else if (error instanceof Error) {
                if (error.message === "jwt expired") {
                    if (!params.request_cnt) params.cnt = 0;
                    params.request_cnt += 1;

                    if (params.request_cnt > 3) return socket.emit("relogin");
                    params.event = socket.data.event
                    socket.emit("token expired", params);
                } else {
                    // logError(error, { socketId: socket.id, event: "unknown" });
                    socket.emit("relogin");
                }
            } else {
                socket.emit("relogin");
            }
        }
    }

    io.on("connection", (socket: Socket) => {
        const roomCode = socket.handshake.query.roomCode as string | undefined;
        if (roomCode) {
            socket.data.roomCode = roomCode;
            socket.join(roomCode);
        } else {
            socket.disconnect();
        }

        socket.onAny((event, ...args) => {
            socket.data.event = event;
            // console.log(`[${socket.data.roomCode}] ${event}`)
        });

        socket.on("disconnect", () => gameController.disconnect(io, socket));

        /* GAME */
        socket.on("game start", (params) => eventMiddleware(params, socket, () => gameController.startGame(io, socket, params)));
        // socket.on("get song", (params) => eventMiddleware(params, socket, () => gameController.getSong(io, socket, params)));
        socket.on("ready song", (params) => eventMiddleware(params, socket, () => gameController.readySong(io, socket, params)));
        socket.on("play song", (params) => eventMiddleware(params, socket, () => gameController.playSong(io, socket, params)));
        socket.on("pass song", (params) => eventMiddleware(params, socket, () => gameController.passSong(io, socket, params)));

        socket.on("join user", (params) => eventMiddleware(params, socket, () => gameController.joinUser(io, socket, params)));
        socket.on("user kick", (params) => eventMiddleware(params, socket, () => gameController.kickUser(io, socket, params), UserKickRequestDto));
        socket.on("change game setting", (params) => eventMiddleware(params, socket, () => gameController.updateRoomSettings(io, socket, params), ChangeGameSettingRequestDto));
        socket.on("change user name", (params) => eventMiddleware(params, socket, () => gameController.changeUserName(io, socket, params), ChangeUserNameRequestDto));
        socket.on("change user status", (params) => eventMiddleware(params, socket, () => gameController.changeUserStatus(io, socket, params)));
        socket.on("leave game", (params) => eventMiddleware(params, socket, () => gameController.leaveRoom(io, socket, params)));

        /* ANSWER */
        socket.on("submit answer", (params) => eventMiddleware(params, socket, () => answerController.submitAnswer(io, socket, params)));
    });
}
