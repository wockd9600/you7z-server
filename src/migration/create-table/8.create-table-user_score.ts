import UserScore from "../../models/UserScore";

console.log("======Create User Table======");

const create_table_user_score = async () => {
    await UserScore.sync({ force: true })
        .then(() => {
            console.log("Success Create User Table");
        })
        .catch((err: any) => {
            console.log(err);
        });
};

create_table_user_score();
