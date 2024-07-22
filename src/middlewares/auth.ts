import { Request, Response, NextFunction } from "express";
import jwt from "../modules/jwt";

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    let token = null;
    if (req.headers) {
        token = req.headers.authorization && req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        // 토큰이 없는 경우
        return res.status(401).json({ message: "로그인 정보가 없습니다. 로그인 해주세요." });
    }

    try {
        const decoded = await jwt.verify(token);

        req.user = decoded as { user_id: number };
        next();
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === "jwt expired") {
                res.status(419).json({ message: "토큰이 만료됐습니다. 재발급 해주세요" });
            } else {
                res.status(401).json({ message: "로그인 정보가 없습니다. 로그인 해주세요." });
            }
        } else {
            res.status(500).json({ message: "Unknown error" });
        }
    }
};

export { isLoggedIn };
