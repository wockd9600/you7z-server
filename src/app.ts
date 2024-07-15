import "dotenv/config";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import initializeSocket from "./socket";

import todoRoutes from "./routes/ztodos";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// connect db

// connect route
// app.use("/todos", todoRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ message: err.message });
});

const ioServer = initializeSocket(app);
ioServer.listen(8000, () => {
    console.log("서버 시작");
});
