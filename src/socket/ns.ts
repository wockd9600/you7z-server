import jwt from "../modules/jwt";

import { Socket, Namespace } from "socket.io";

import GameRepository from "../repositories/implementations/game";
import AnswerRepository from "../repositories/implementations/answer";
import GameController from "../controllers/socket/game";
import AnswerController from "../controllers/socket/answer";

const gameRepository = new GameRepository();
const answerRepository = new AnswerRepository();
const gameController = new GameController(gameRepository);
const answerController = new AnswerController(answerRepository, gameRepository);

export default function initializeNamespace(io: Namespace) {
    async function eventMiddleware(params: any, socket: Socket, next: Function) {
        try {
            const { token } = params;
            if (!token) throw new Error("로그인 정보가 없습니다.");

            const decoded = await jwt.verify(token);

            if (typeof decoded === "object" && decoded !== null && "user_id" in decoded) {
                socket.data.user = decoded as { user_id: number };
                return next();
            } else {
                throw new Error("don't exist user_id");
            }

            // *수정 log
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === "jwt expired") {
                    if (!params.request_cnt) params.cnt = 0;

                    params.request_cnt += 1;
                    if (params.request_cnt > 3) return socket.emit("relogin");
                    socket.emit("token expired", params);
                } else {
                    socket.emit("relogin");
                }
            } else {
                socket.emit("relogin");
            }
        }
    }

    io.on("connection", (socket: Socket) => {
        console.log("a user connected");

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });

        // *수정
        // 소켓에서 받는 데이터들 검증해야함
        /* GAME */
        socket.on("game start", (params) => eventMiddleware(params, socket, () => gameController.startGame(io, socket, params)));
        socket.on("user kick", (params) => eventMiddleware(params, socket, () => gameController.kickUser(io, socket, params)));
        socket.on("play song", (params) => eventMiddleware(params, socket, () => gameController.playSong(io, socket, params)));
        socket.on("change game setting", (params) => eventMiddleware(params, socket, () => gameController.updateRoomSettings(io, socket, params)));
        socket.on("change user name", (params) => eventMiddleware(params, socket, () => gameController.changeUserName(io, socket, params)));
        socket.on("leave game", (params) => eventMiddleware(params, socket, () => gameController.leaveRoom(io, socket, params)));

        /* ANSWER */
        socket.on("submit answer", (params) => eventMiddleware(params, socket, () => answerController.submitAnswer(io, socket, params)));
    });
}
