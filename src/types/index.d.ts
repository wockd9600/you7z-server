import { Request } from "express";
import { Socket } from "socket.io";

declare global {
    namespace Express {
        interface Request {
            user?: { user_id: number };
            dto?: any;
        }
    }
}
