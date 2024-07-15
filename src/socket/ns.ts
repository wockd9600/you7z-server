import { Socket, Namespace } from "socket.io";

export default function initializeNamespace(io: Namespace) {
    io.on("connection", (socket: Socket) => {
        console.log("a user connected");

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });

        socket.on("chat message", (msg: string) => {
            console.log("message: " + msg);
            io.emit("chat message", msg);
        });
    });
}
