import { QueryInterface, Sequelize, Options } from "sequelize";
import * as dotenv from "dotenv";
dotenv.config();

class options implements Options {
    dialect!: "mysql";
    username!: string;
    password!: string;
}

const createDBOptions = new options();
createDBOptions.username = process.env.RDS_USER!;
createDBOptions.password = process.env.RDS_PASSWORD!;
createDBOptions.dialect = "mysql";

let db_name = process.env.RDS_DATABASE!;

const dbCreateSequelize = new Sequelize(createDBOptions);

console.log(`======Create DataBase : ${db_name}======`);

dbCreateSequelize
    .getQueryInterface()
    .createDatabase(db_name)
    .then(() => {
        console.log(`database ${db_name} create success!`);
    })
    .catch((e) => {
        console.log("error in create db : ", e);
    });
