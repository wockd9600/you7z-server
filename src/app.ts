import "dotenv/config";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";

import todoRoutes from "./routes/ztodos";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// connect db

app.use("/todos", todoRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ message: err.message });
});

app.listen(3000);
