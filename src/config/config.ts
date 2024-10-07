import * as dotenv from "dotenv";
dotenv.config();

console.log("config : ", process.env.RDS_DATABASE)

export const config = {
    development: {
        host: process.env.RDS_HOST!,
        user: process.env.RDS_USER!,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE!,
        port: process.env.RDS_PORT,
    },
};
