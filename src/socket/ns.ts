import { Socket, Namespace } from "socket.io";
import GameController from "../controllers/socket/game";
import AnswerController from "../controllers/socket/answer";

const gameController = new GameController();
const answerController = new AnswerController();

export default function initializeNamespace(io: Namespace) {
    io.on("connection", (socket: Socket) => {
        console.log("a user connected");

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });

        /* GAME */
        socket.on("game start", gameController.startGame);
        socket.on("user kick", gameController.kickUser);
        socket.on("play song", gameController.playSong);
        socket.on("change game setting", gameController.updateRoomSettings);
        socket.on("change user name", gameController.changeUserName);
        socket.on("leave game", gameController.leaveRoom);

        /* ANSWER */
        socket.on("submit answer", answerController.submitAnswer);
    });
}
