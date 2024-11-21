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
    pool: {
        max: 10, // 최대 연결 수를 15로 증가
        min: 0,
        acquire: 20000, // 연결 대기 시간(밀리초)을 늘리기
        idle: 5000,       // 연결이 사용되지 않으면 5초 후 해제
    },
});
