import { Request, Response, NextFunction } from "express";
import { validateOrReject } from "class-validator";
import { plainToClass } from "class-transformer";

export function validateBody(schema: any) {
    return async function (req: Request, res: Response, next: NextFunction) {
        const target = plainToClass(schema, req.body);
        try {
            await validateOrReject(target);
            req.dto = target;
            next();
        } catch (error) {
            res.status(400).json({ message: error});
        }
    };
}
