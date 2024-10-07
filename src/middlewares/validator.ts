import { Request, Response, NextFunction } from "express";
import { validateOrReject, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { logError } from "../utils/error";

export function validateBody(schema: any) {
    return async function (req: Request, res: Response, next: NextFunction) {
        try {
            // console.log(req.body);
            const target = plainToClass(schema, req.body, { excludeExtraneousValues: true });
            await validateOrReject(target);
            req.dto = target;
            next();
        } catch (error) {
            if (Array.isArray(error) && error.every((e) => e instanceof ValidationError)) {
                const validateError: Error = {
                    name: "ValidationError",
                    message: `property: ${error[0].property}`,
                    stack: "ValidationError",
                };
                logError(validateError, req);
            } else if (error instanceof Error) logError(error, req);
            res.status(400).json(error);
        }
    };
}
