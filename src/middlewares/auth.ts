import { Request, Response, NextFunction } from "express";

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    req.user = { id: 1 };
    next();
};

export { isLoggedIn };
