import { Sequelize } from "sequelize";
import { config } from "../config/config";

// export const sequelize = new Sequelize('typescript_test', 'root','Jaehyeon2!',{
//     host : 'localhost',
//     dialect : 'mysql',
// })


export const sequelize = new Sequelize(config.development.database, config.development.user, config.development.password, {
    host: config.development.host,
    dialect: "mysql",
    logging: false,
});
