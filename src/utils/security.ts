import crypto from "crypto";

export const encrypt = () => {
    return crypto.randomUUID();
};
