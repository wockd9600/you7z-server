import { Request, Response, NextFunction } from "express";
import jwt from "../modules/jwt";
import { logError } from "../utils/error";

const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    // *수정 테스트
    // req.user = { user_id: parseInt(req.body.id) };
    // next();
    // return 
    
    let token = null;
    if (req.headers) {
        token = req.headers.authorization && req.headers.authorization.split(" ")[1];
    }

    if (!token || !jwtRegex.test(token)) {
        // 토큰이 없는 경우
        return res.status(401).json({ message: "로그인 정보가 없습니다. 로그인 해주세요." });
    }

    try {
        const decoded = await jwt.verify(token);
        if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
            req.user = { user_id: decoded.id } as { user_id: number };
            next();
        } else {
            throw new Error("don't exist user id");
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === "jwt expired") {
                res.status(419).json({ message: "토큰이 만료됐습니다. 재발급 해주세요" });
            } else {
                logError(error, req);
                res.status(402).json({ message: "유호하지 않은 토큰입니다." });
            }
        } else {
            res.status(500).json({ message: "Unknown error" });
        }
    }
};

export { isLoggedIn };
