import * as fs from "fs";
import * as path from "path";
import { exec, execFile } from "child_process";
import * as util from "util";

console.log("migration-all-table");

const asyncExec = util.promisify(exec);

exec('ts-node "./src/migration/create-db.ts"', (error, stdout, stderr) => {
    if (error) {
        console.log(`exec drror : ${error}`);
        return;
    }
    if (stdout) console.log(`${stdout}`);
    if (stderr) console.log(`err : ${stderr}`);
});


let migrationAllTable = async () => {
    let migrationFiles: string[] = [];

    fs.readdir(path.join(__dirname, "/", "create-table"), async (err, files) => {
        if (err) console.log("err : ", err);
        if (files) {
            files.forEach((el) => {
                // console.log(el.substr(el.indexOf('.')+1,12));
                if (el.substr(el.indexOf(".") + 1, 12) === "create-table") {
                    migrationFiles.push(el);
                }
            });

            migrationFiles.sort((a, b) => {
                return Number(a.substr(0, a.indexOf("."))) - Number(b.substr(0, b.indexOf(".")));
            });

            for (let el of migrationFiles) {
                console.log("Migration File Name : ", el);

                console.log(`ts-node "${__dirname}/create-table/${el}"`)
                const { stdout, stderr } = await asyncExec(`ts-node "${__dirname}/create-table/${el}"`);
                if (stdout) console.log(stdout);
                if (stderr) console.error("Std Err : ", stderr);
            }
        }
    });
};

migrationAllTable();
