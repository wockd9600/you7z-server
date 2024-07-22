import jwt, { SignOptions } from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET_KEY!;

const options: SignOptions = {
    algorithm: "HS256", // 해싱 알고리즘
    expiresIn: "10m", // 토큰 유효 기간
    issuer: "issuer", // 발행자
};

export default {
    sign: async (user: { user_id: number }) => {
        const payload = {
            id: user.user_id,
        };
        return jwt.sign(payload, SECRET_KEY, options);
    },
    verify: async (token: string) => {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    },
    decode: async (token: string) => {
        return jwt.decode(token);
    },
};
